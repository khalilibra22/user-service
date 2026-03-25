import { injectable, inject } from "tsyringe";
import { AppDataSource } from "../config/database";
import { TransactionModel } from "../models/transaction.model";
import { UserModel } from "../models/user.model";
import { TransactionStatus } from "../enums/transaction-status.enum";
import { PaymentMethod } from "../enums/payment-method.enum";
import { PaymentProvider } from "../enums/payment-provider.enum";
import { SatimProvider } from "./payment-providers/satim.provider";
import { NotificationService } from "./notification.service";
import { CouponService } from "./coupon.service";
import { getLogger } from "../utils/logger";
import { Repository } from "typeorm";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { UserWalletModel } from "../models/user-wallet.model";
import { EarningModel } from "../models/earning.model";
import { EarningStatus } from "../enums/earning-status.enum";
import { SubscriptionModel } from "../models/subscription.model";
import { PlanModel } from "../models/plan.model";
import { WalletTransactionModel, WalletTransactionPurpose, WalletTransactionType } from "../models/wallet-transaction.model";

const log = getLogger();

@injectable()
export class PaymentService {
    private userRepo: Repository<UserModel>;
    private transactionRepo: Repository<TransactionModel>;
    private earningRepo: Repository<EarningModel>;
    private walletRepo: Repository<UserWalletModel>;
    private walletTxRepo: Repository<WalletTransactionModel>;
    private subscriptionRepo: Repository<SubscriptionModel>;
    private satimProvider: SatimProvider;
    private notificationService: NotificationService;
    private couponService: CouponService;

    constructor(
        @inject(NotificationService) notificationService: NotificationService,
        @inject(CouponService) couponService: CouponService
    ) {
        this.userRepo = AppDataSource.getRepository(UserModel);
        this.transactionRepo = AppDataSource.getRepository(TransactionModel);
        this.earningRepo = AppDataSource.getRepository(EarningModel);
        this.walletRepo = AppDataSource.getRepository(UserWalletModel);
        this.walletTxRepo = AppDataSource.getRepository(WalletTransactionModel);
        this.subscriptionRepo = AppDataSource.getRepository(SubscriptionModel);
        this.satimProvider = new SatimProvider();
        this.notificationService = notificationService;
        this.couponService = couponService;
    }

    async initiateTransaction(payload: {
        userId: string;
        amount: number;
        method: PaymentMethod;
        referenceType: "SUBSCRIPTION" | "COURSE_ENROLLMENT" | "ONE_ON_ONE_ENROLLMENT" | "WALLET_TOPUP";
        referenceId?: string;
        description: string;
        metadata?: any;
        couponCode?: string;
        receiptUrl?: string;
        senderCcpAccount?: string;
        senderFullName?: string;
        phoneNumber?: string;
        externalTransactionId?: string;
        notes?: string;
        returnUrl?: string;
    }): Promise<{ transactionId: string; paymentUrl?: string; message?: string; currency?: string; discount?: { couponCode: string; originalAmount: number; discountAmount: number; finalAmount: number } }> {
        const {
            userId,
            amount,
            method,
            referenceType,
            referenceId,
            description,
            metadata,
            couponCode,
            receiptUrl,
            senderCcpAccount,
            senderFullName,
            phoneNumber,
            externalTransactionId,
            notes,
            returnUrl,
        } = payload;
        const currency = process.env.PAYMENT_CURRENCY || "DZD";

        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        // ── Coupon validation (before touching the DB transaction) ────────────
        let effectiveAmount = amount;
        let couponMeta: { couponCode: string; originalAmount: number; discountAmount: number; finalAmount: number } | undefined;

        if (couponCode && couponCode.trim()) {
            const resourceType = metadata?.courseType ?? undefined;
            const resourceId = referenceId ?? undefined;
            const couponResult = await this.couponService.validateAndComputeDiscount(
                couponCode.trim(),
                amount,
                resourceType,
                resourceId
            );
            effectiveAmount = couponResult.finalAmount;
            couponMeta = {
                couponCode: couponCode.trim(),
                originalAmount: couponResult.originalAmount,
                discountAmount: couponResult.discountAmount,
                finalAmount: couponResult.finalAmount,
            };
            log.info({ couponCode, originalAmount: amount, finalAmount: effectiveAmount, discountAmount: couponResult.discountAmount }, "Coupon applied to transaction");
        }
        // ─────────────────────────────────────────────────────────────────────

        const transaction = new TransactionModel();
        transaction.amount = effectiveAmount;
        transaction.currency = currency;
        transaction.method = method;
        transaction.referenceType = referenceType;
        // Generate a random reference ID for WALLET_TOPUP if not provided
        transaction.referenceId = referenceType === "WALLET_TOPUP" && !referenceId 
            ? require("crypto").randomUUID() 
            : referenceId!;
        transaction.description = description;
        transaction.user = user;
        transaction.status = TransactionStatus.PENDING;
        // Merge coupon metadata with any caller-provided metadata
        transaction.metadata = {
            ...metadata,
            ...(couponMeta && { coupon: couponMeta }),
            ...(returnUrl && { returnUrl })
        };

        if (method === PaymentMethod.WALLET && referenceType === "WALLET_TOPUP") {
            throw new Error("Cannot top-up wallet using wallet balance");
        }

        // Determine Provider based on Method
        if (method === PaymentMethod.SATIM) {
            transaction.provider = PaymentProvider.SATIM;
        } else if (method === PaymentMethod.WALLET) {
            transaction.provider = PaymentProvider.MANUAL; // Wallet is internal but handled as manual for provider tracking
        } else {
            transaction.provider = PaymentProvider.MANUAL;
        }

        // If manual method and receipt is provided directly
        if ((method === PaymentMethod.BARIDIMOB || method === PaymentMethod.CCP_TRANSFER) && receiptUrl) {
            transaction.receiptUrl = receiptUrl;
            transaction.status = TransactionStatus.PENDING_VERIFICATION;
            
            // Store extra details in metadata
            transaction.metadata = {
                ...transaction.metadata,
                manualPaymentDetails: {
                    senderCcpAccount,
                    senderFullName,
                    phoneNumber,
                    externalTransactionId,
                    notes,
                }
            };

            if (method === PaymentMethod.BARIDIMOB && externalTransactionId) {
                transaction.externalId = externalTransactionId;
            }
        }

        const savedTransaction = await this.transactionRepo.save(transaction);

        if (method === PaymentMethod.SATIM) {
            // Build backend callback URLs so SATIM redirects here for auto-verification.
            // SERVICE_BASE_URL must be the publicly reachable URL of this service.
            const baseUrl = (process.env.SERVICE_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");
            const backendReturnUrl = `${baseUrl}/v1/payments/satim/callback?transactionId=${savedTransaction.id}`;
            const backendFailUrl = `${baseUrl}/v1/payments/satim/callback?transactionId=${savedTransaction.id}`;

            const response = await this.satimProvider.initiatePayment(
                effectiveAmount,
                currency,
                savedTransaction.id, // Use transaction ID as order ID
                backendReturnUrl,
                backendFailUrl
            );

            savedTransaction.externalId = response.externalId;
            await this.transactionRepo.save(savedTransaction);

            return {
                transactionId: savedTransaction.id,
                paymentUrl: response.paymentUrl,
                ...(couponMeta && { discount: couponMeta }),
            };
        } else if (method === PaymentMethod.WALLET) {
            // Internal Wallet Payment
            const wallet = await this.walletRepo.findOne({ where: { userId } });
            if (!wallet || Number(wallet.currentBalance) < amount) {
                throw new Error("Insufficient wallet balance");
            }

            await AppDataSource.transaction(async (transactionalEntityManager) => {
                // Deduct from wallet
                wallet.currentBalance = Number(wallet.currentBalance) - amount;
                await transactionalEntityManager.save(UserWalletModel, wallet);

                // Create Wallet Transaction log
                const walletTx = new WalletTransactionModel();
                walletTx.userId = userId;
                walletTx.amount = amount;
                walletTx.type = WalletTransactionType.DEBIT;
                walletTx.purpose = WalletTransactionPurpose.PURCHASE;
                walletTx.metadata = { transactionId: savedTransaction.id, referenceType, referenceId };
                await transactionalEntityManager.save(WalletTransactionModel, walletTx);

                // Mark Transaction as Success immediately
                savedTransaction.status = TransactionStatus.SUCCESS;
                await transactionalEntityManager.save(TransactionModel, savedTransaction);
            });

            log.info({ transactionId: savedTransaction.id, metadata: savedTransaction.metadata }, "Wallet payment successful, calling handlePostPayment");
            await this.handlePostPayment(savedTransaction);

            return {
                transactionId: savedTransaction.id,
                message: "Payment completed successfully using your wallet balance.",
                ...(couponMeta && { discount: couponMeta }),
            };
        } else {
            // Manual Method (Baridimob or Transfer)
            return {
                transactionId: savedTransaction.id,
                message: "Payment receipt submitted successfully. Your transaction is now pending verification.",
                ...(couponMeta && { discount: couponMeta }),
            };
        }
    }

    async submitReceipt(transactionId: string, data: {
        receiptUrl: string;
        senderCcpAccount?: string;
        senderFullName?: string;
        phoneNumber?: string;
        externalTransactionId?: string;
        notes?: string;
    }): Promise<TransactionModel> {
        const transaction = await this.transactionRepo.findOne({ where: { id: transactionId } });
        if (!transaction) throw new Error("Transaction not found");

        if (
            transaction.status !== TransactionStatus.PENDING && 
            transaction.status !== TransactionStatus.FAILED &&
            transaction.status !== TransactionStatus.PENDING_VERIFICATION
        ) {
            throw new Error(`Transaction cannot be updated because it is already ${transaction.status}`);
        }

        transaction.receiptUrl = data.receiptUrl;
        transaction.status = TransactionStatus.PENDING_VERIFICATION;

        // Store extra details in metadata
        transaction.metadata = {
            ...transaction.metadata,
            manualPaymentDetails: {
                senderCcpAccount: data.senderCcpAccount,
                senderFullName: data.senderFullName,
                phoneNumber: data.phoneNumber,
                externalTransactionId: data.externalTransactionId,
                notes: data.notes,
            }
        };

        // If BaridiMob, also update externalId with the transaction ID provided
        if (transaction.method === PaymentMethod.BARIDIMOB && data.externalTransactionId) {
            transaction.externalId = data.externalTransactionId;
        }

        return await this.transactionRepo.save(transaction);
    }

    async validateManualTransaction(transactionId: string, status: TransactionStatus.SUCCESS | TransactionStatus.FAILED, adminNote?: string): Promise<TransactionModel> {
        const transaction = await this.transactionRepo.findOne({ where: { id: transactionId } });
        if (!transaction) throw new Error("Transaction not found");

        transaction.status = status;
        if (adminNote) transaction.adminNote = adminNote;

        const updatedTransaction = await this.transactionRepo.save(transaction);

        await this.handlePostPayment(updatedTransaction); // handlePostPayment should now handle both success and failure

        return updatedTransaction;
    }

    // Handle Post-Payment Logic (Callbacks)
    private async handlePostPayment(transaction: TransactionModel) {
        const isSuccess = transaction.status === TransactionStatus.SUCCESS;
        const teacherId = transaction.metadata?.teacherId;
        log.info({ transactionId: transaction.id, isSuccess, teacherId }, "Handling post-payment logic");

        // ── Coupon usage tracking ─────────────────────────────────────────────
        const couponCode: string | undefined = transaction.metadata?.coupon?.couponCode;
        if (couponCode) {
            if (isSuccess) {
                await this.couponService.applyCouponUsage(couponCode);
            } else {
                // FAILED or CANCELED — roll back any in-flight reservation
                await this.couponService.rollbackCouponUsage(couponCode);
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        // ── Send payment confirmation email (fire-and-forget) ────────────────
        if (isSuccess) {
            void this.sendPaymentConfirmationEmail(transaction);
        }
        // ─────────────────────────────────────────────────────────────────────

        if (transaction.referenceType === "SUBSCRIPTION") {
            const { container: cont } = await import("../container");
            const { SubscriptionService } = await import("./subscription.service");
            const subscriptionService = cont.resolve(SubscriptionService);
            if (isSuccess) {
                const isRenewal = transaction.metadata?.isRenewal === true;
                if (isRenewal && transaction.metadata?.renewsFrom) {
                    // Renewal: activate from stored renewsFrom date so billing period is continuous
                    const renewsFrom = new Date(transaction.metadata.renewsFrom);
                    await subscriptionService.activateRenewalSubscription(transaction.referenceId, renewsFrom);
                } else {
                    // Normal purchase or upgrade
                    await subscriptionService.activateSubscription(transaction.referenceId);
                }
            } else {
                await subscriptionService.deactivateSubscription(transaction.referenceId);
            }

        } else if (transaction.referenceType === "WALLET_TOPUP") {
            if (isSuccess) {
                try {
                    await AppDataSource.transaction(async (transactionalEntityManager) => {
                        const transUserId = transaction.user?.id || (transaction as any).userId;
                        if (!transUserId) throw new Error("Transaction user ID is missing");

                        let wallet = await transactionalEntityManager.findOne(UserWalletModel, { where: { userId: transUserId } });
                        if (!wallet) {
                            wallet = new UserWalletModel();
                            wallet.userId = transUserId;
                            wallet.totalEarned = 0;
                            wallet.currentBalance = 0;
                            wallet.frozenBalance = 0;
                        }

                        wallet.currentBalance = Number(wallet.currentBalance) + Number(transaction.amount);
                        await transactionalEntityManager.save(UserWalletModel, wallet);

                        const walletTx = new WalletTransactionModel();
                        walletTx.userId = transUserId;
                        walletTx.amount = transaction.amount;
                        walletTx.type = WalletTransactionType.CREDIT;
                        walletTx.purpose = WalletTransactionPurpose.TOPUP;
                        walletTx.metadata = { transactionId: transaction.id, referenceType: transaction.referenceType, referenceId: transaction.referenceId };
                        await transactionalEntityManager.save(WalletTransactionModel, walletTx);
                    });
                    log.info({ transactionId: transaction.id }, "Wallet top-up successful");
                } catch (error: any) {
                    log.error({ err: error, transactionId: transaction.id }, "Failed to process wallet top-up");
                }
            }
        } else if (transaction.referenceType === "COURSE_ENROLLMENT" || transaction.referenceType === "ONE_ON_ONE_ENROLLMENT") {
            // Handle Earnings if successful
            if (isSuccess && transaction.metadata?.teacherId) {
                await this.createEarningRecord(transaction);
            }

            // Notify Course Service via webhook with retries
            const notifyCourseService = async (attempt: number = 1) => {
                const maxAttempts = 3;
                const delays = [1000, 5000, 30000]; // 1s, 5s, 30s

                try {
                    const courseServiceUrl = process.env.COURSE_SERVICE_URL || "http://localhost:5001";
                    const debugPath = path.join(process.cwd(), "user-webhook-debug.log");
                    const payload = {
                        transactionId: transaction.id,
                        externalId: transaction.externalId,
                        referenceId: transaction.referenceId,
                        referenceType: transaction.referenceType,
                        status: isSuccess ? "success" : "failed",
                        provider: transaction.provider,
                        method: transaction.method
                    };

                    fs.appendFileSync(debugPath, `[${new Date().toISOString()}] Attempt ${attempt}/${maxAttempts}: ${courseServiceUrl} payload: ${JSON.stringify(payload)}\n`);
                    log.info({ courseServiceUrl, transactionId: transaction.id, attempt }, "Notifying Course Service via webhook");

                    const response = await axios.post(`${courseServiceUrl}/v1/payment-webhooks/webhook`, payload, {
                        headers: {
                            "x-internal-api-key": process.env.INBOUND_API_KEY || "12345"
                        }
                    });

                    fs.appendFileSync(debugPath, `[${new Date().toISOString()}] Response: ${response.status} ${JSON.stringify(response.data)}\n`);
                    log.info({ status: response.status, data: response.data, attempt }, "Course Service notified successfully");
                } catch (error: any) {
                    const debugPath = path.join(process.cwd(), "user-webhook-debug.log");
                    fs.appendFileSync(debugPath, `[${new Date().toISOString()}] Attempt ${attempt} ERROR: ${error.message}\n`);
                    
                    if (attempt < maxAttempts) {
                        const delay = delays[attempt - 1];
                        log.warn({ err: error.message, nextRetryIn: delay, attempt }, "Webhook failed, retrying...");
                        setTimeout(() => notifyCourseService(attempt + 1), delay);
                    } else {
                        log.error({
                            err: error.message,
                            response: error.response?.data,
                            status: error.response?.status,
                            attempts: attempt
                        }, "CRITICAL: Webhook failed after all retry attempts");
                    }
                }
            };

            void notifyCourseService();
        }
    }

    private async sendPaymentConfirmationEmail(transaction: TransactionModel): Promise<void> {
        try {
            // Load user if not already in the relation
            const user = transaction.user ?? await this.userRepo.findOne({ where: { id: (transaction as any).userId } });
            if (!user?.email) {
                log.warn({ transactionId: transaction.id }, "Cannot send payment email — user or email missing");
                return;
            }

            const referenceLabels: Record<string, string> = {
                COURSE_ENROLLMENT: "Inscription au cours",
                ONE_ON_ONE_ENROLLMENT: "Session individuelle",
                SUBSCRIPTION: "Abonnement",
            };
            const itemName = transaction.description || referenceLabels[transaction.referenceType] || transaction.referenceType;

            await this.notificationService.sendPaymentSuccess(
                user.email,
                user.fullname || "Utilisateur",
                Number(transaction.amount).toFixed(2) as any,
                transaction.currency || "DZD",
                itemName,
                transaction.id
            );
            log.info({ transactionId: transaction.id, email: user.email }, "Payment confirmation email sent");
        } catch (err) {
            // Never fail the payment flow because of email
            log.error({ err, transactionId: transaction.id }, "Failed to send payment confirmation email");
        }
    }

    private async createEarningRecord(transaction: TransactionModel) {
        const { teacherId, courseType } = transaction.metadata;
        const totalAmount = transaction.amount;
        let feePercentage = 0;

        // Fetch teacher subscription to determine dynamic fees
        const subscription = await this.subscriptionRepo.findOne({
            where: { user: { id: teacherId }, status: "active" },
            relations: ["plan"],
            cache: false,
        });
        let plan = subscription?.plan;

        // Fallback to default free plan if teacher has no active subscription
        if (!plan) {
            const { container: cont } = await import("../container");
            const { SubscriptionService } = await import("./subscription.service");
            const subscriptionService = cont.resolve(SubscriptionService);
            const newSubscription = await subscriptionService.assignDefaultFreePlan(teacherId);
            plan = newSubscription?.plan;
        }

        if (courseType === "one_on_one") {
            feePercentage = plan?.oneOnOneFeePercentage !== undefined ? Number(plan.oneOnOneFeePercentage) / 100 : 0.08;
        } else if (courseType === "prerecorded") {
            feePercentage = plan?.prerecordedFeePercentage !== undefined ? Number(plan.prerecordedFeePercentage) / 100 : 0.08;
        } else if (courseType === "live" || courseType === "group") {
            // Live and Group courses are limited by count quota via subscription, not platform fees
            feePercentage = 0;
        }

        const feeAmount = totalAmount * feePercentage;
        const netAmount = totalAmount - feeAmount;

        // Frozen period in days from .env, default 7
        const frozenDays = parseInt(process.env.EARNING_FROZEN_DAYS || "7");
        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + frozenDays);

        const earning = new EarningModel();
        earning.teacherId = teacherId;
        earning.transactionId = transaction.id;
        earning.amount = netAmount;
        earning.feeAmount = feeAmount;
        earning.status = EarningStatus.FROZEN;
        earning.releaseDate = releaseDate;

        await this.earningRepo.save(earning);

        // Update Teacher Balance (Frozen balance)
        let balance = await this.walletRepo.findOne({ where: { userId: teacherId } });
        if (!balance) {
            balance = new UserWalletModel();
            balance.userId = teacherId;
            balance.totalEarned = 0;
            balance.currentBalance = 0;
            balance.frozenBalance = 0;
        }

        balance.frozenBalance = Number(balance.frozenBalance) + netAmount;
        balance.totalEarned = Number(balance.totalEarned) + netAmount;
        await this.walletRepo.save(balance);

        log.info({ teacherId, netAmount, feeAmount, releaseDate, transactionId: transaction.id }, "Earning record created and frozen balance updated");
    }

    async getTransactionByReference(type: string, id: string): Promise<TransactionModel | null> {
        return await this.transactionRepo.findOne({
            where: {
                referenceType: type as any,
                referenceId: id
            },
            order: { createdAt: "DESC" }
        });
    }

    /**
     * Returns the transaction only if it belongs to the given userId.
     * Used to enforce ownership on receipt submission and manual verification.
     */
    async getTransactionByOwner(transactionId: string, userId: string): Promise<TransactionModel | null> {
        return await this.transactionRepo.findOne({
            where: { id: transactionId, user: { id: userId } },
        });
    }

    async getWalletBalance(userId: string): Promise<UserWalletModel | null> {
        return await this.walletRepo.findOne({ where: { userId } });
    }

    async verifySatimTransaction(transactionId: string, externalIdOverride?: string): Promise<{ status: TransactionStatus; transaction: TransactionModel }> {
        const transaction = await this.transactionRepo.findOne({ where: { id: transactionId }, relations: ["user"] });
        if (!transaction) throw new Error("Transaction not found");

        // If already final, just return status + transaction
        if (transaction.status === TransactionStatus.SUCCESS || transaction.status === TransactionStatus.FAILED) {
            return { status: transaction.status, transaction };
        }

        // Use the orderId from SATIM's redirect if provided (most reliable),
        // otherwise fall back to the stored externalId from register.do
        const externalIdToUse = externalIdOverride || transaction.externalId;

        if (!externalIdToUse) {
            throw new Error("Cannot verify SATIM transaction: External ID missing");
        }

        // If SATIM sent a different orderId than what we stored, update the record
        if (externalIdOverride && transaction.externalId !== externalIdOverride) {
            log.info({ transactionId, stored: transaction.externalId, fromRedirect: externalIdOverride }, "Updating externalId from SATIM redirect");
            transaction.externalId = externalIdOverride;
            await this.transactionRepo.save(transaction);
        }

        const result = await this.satimProvider.verifyPayment(externalIdToUse);
        log.info({ transactionId, externalIdToUse, result }, "SATIM verify result");

        if (result.status === "success") {
            transaction.status = TransactionStatus.SUCCESS;
            const updated = await this.transactionRepo.save(transaction);
            await this.handlePostPayment(updated);
            return { status: TransactionStatus.SUCCESS, transaction: updated };
        } else if (result.status === "failed") {
            transaction.status = TransactionStatus.FAILED;
            const updated = await this.transactionRepo.save(transaction);
            await this.handlePostPayment(updated);
            return { status: TransactionStatus.FAILED, transaction: updated };
        }

        return { status: transaction.status, transaction };

    }

    async refundToWallet(userId: string, amount: number | undefined, referenceType: string, referenceId: string): Promise<void> {
        log.info({ userId, amount, referenceType, referenceId }, "Processing refund to wallet");

        // 1. Find the successful transaction for this reference
        const transaction = await this.transactionRepo.findOne({
            where: {
                user: { id: userId },
                referenceType: referenceType as any,
                referenceId: referenceId,
                status: TransactionStatus.SUCCESS
            }
        });

        if (!transaction) {
            log.error({ userId, referenceType, referenceId }, "Refund failed: No successful transaction found");
            throw new Error("No successful transaction found for this reference");
        }

        // 2. Check if already refunded
        if (transaction.status === TransactionStatus.REFUNDED as any) {
             throw new Error("Transaction has already been refunded");
        }

        // 3. Determine refund amount (trust transaction amount if caller didn't provide one or provided a higher one)
        const refundAmount = (amount && amount <= Number(transaction.amount)) ? amount : Number(transaction.amount);
        
        if (amount && amount > Number(transaction.amount)) {
            log.warn({ requested: amount, actual: transaction.amount }, "Refund amount requested exceeds transaction amount. Using transaction amount.");
        }

        await AppDataSource.transaction(async (transactionalEntityManager) => {
            // Update transaction status to REFUNDED
            transaction.status = TransactionStatus.REFUNDED as any;
            await transactionalEntityManager.save(TransactionModel, transaction);

            // Update user wallet
            let wallet = await transactionalEntityManager.findOne(UserWalletModel, { where: { userId } });
            if (!wallet) {
                wallet = new UserWalletModel();
                wallet.userId = userId;
                wallet.totalEarned = 0;
                wallet.currentBalance = 0;
                wallet.frozenBalance = 0;
            }

            wallet.currentBalance = Number(wallet.currentBalance) + refundAmount;
            await transactionalEntityManager.save(UserWalletModel, wallet);

            // Create Wallet Transaction log for user
            const walletTx = new WalletTransactionModel();
            walletTx.userId = userId;
            walletTx.amount = refundAmount;
            walletTx.type = WalletTransactionType.CREDIT;
            walletTx.purpose = WalletTransactionPurpose.REFUND;
            walletTx.metadata = { transactionId: transaction.id, referenceType, referenceId };
            await transactionalEntityManager.save(WalletTransactionModel, walletTx);

            // 4. Reverse Teacher Earnings
            const earning = await transactionalEntityManager.findOne(EarningModel, {
                where: { transactionId: transaction.id }
            });

            if (earning && earning.status !== EarningStatus.CANCELED as any) {
                log.info({ earningId: earning.id, teacherId: earning.teacherId }, "Reversing teacher earning");
                
                const earningAmount = Number(earning.amount);
                earning.status = EarningStatus.CANCELED as any;
                await transactionalEntityManager.save(EarningModel, earning);

                // Deduct from teacher wallet
                let teacherWallet = await transactionalEntityManager.findOne(UserWalletModel, { 
                    where: { userId: earning.teacherId } 
                });

                if (teacherWallet) {
                    // Reverse the earning addition to totalEarned
                    teacherWallet.totalEarned = Number(teacherWallet.totalEarned) - earningAmount;
                    
                    // If earning was still frozen, deduct from frozenBalance
                    if (earning.status === EarningStatus.FROZEN) {
                        teacherWallet.frozenBalance = Number(teacherWallet.frozenBalance) - earningAmount;
                    } else {
                        // Otherwise deduct from currentBalance
                        teacherWallet.currentBalance = Number(teacherWallet.currentBalance) - earningAmount;
                    }
                    await transactionalEntityManager.save(UserWalletModel, teacherWallet);
                }
            }
        });

        log.info({ userId, refundAmount }, "Refund to wallet completed successfully");
    }

    async getUserTransactions(userId: string, page: number = 1, limit: number = 10): Promise<{ transactions: TransactionModel[], total: number }> {
        const skip = (page - 1) * limit;
        const [transactions, total] = await this.transactionRepo.findAndCount({
            where: { user: { id: userId } },
            order: { createdAt: "DESC" },
            skip,
            take: limit
        });
        
        return { transactions, total };
    }
}
