import { AppDataSource } from "../config/database";
import { TransactionModel } from "../models/transaction.model";
import { UserModel } from "../models/user.model";
import { TransactionStatus } from "../enums/transaction-status.enum";
import { PaymentMethod } from "../enums/payment-method.enum";
import { PaymentProvider } from "../enums/payment-provider.enum";
import { SatimProvider } from "./payment-providers/satim.provider";
import { getLogger } from "../utils/logger";
import { Repository } from "typeorm";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { UserWalletModel } from "../models/user-wallet.model";
import { EarningModel } from "../models/earning.model";
import { EarningStatus } from "../enums/earning-status.enum";
import { SubscriptionModel } from "../models/subscription.model";
import { WalletTransactionModel, WalletTransactionPurpose, WalletTransactionType } from "../models/wallet-transaction.model";

const log = getLogger();

export class PaymentService {
    private userRepo: Repository<UserModel>;
    private transactionRepo: Repository<TransactionModel>;
    private earningRepo: Repository<EarningModel>;
    private walletRepo: Repository<UserWalletModel>;
    private walletTxRepo: Repository<WalletTransactionModel>;
    private subscriptionRepo: Repository<SubscriptionModel>;
    private satimProvider: SatimProvider;

    constructor() {
        this.userRepo = AppDataSource.getRepository(UserModel);
        this.transactionRepo = AppDataSource.getRepository(TransactionModel);
        this.earningRepo = AppDataSource.getRepository(EarningModel);
        this.walletRepo = AppDataSource.getRepository(UserWalletModel);
        this.walletTxRepo = AppDataSource.getRepository(WalletTransactionModel);
        this.subscriptionRepo = AppDataSource.getRepository(SubscriptionModel);
        this.satimProvider = new SatimProvider();
    }

    async initiateTransaction(payload: {
        userId: string;
        amount: number;
        currency: string;
        method: PaymentMethod;
        referenceType: "SUBSCRIPTION" | "COURSE_ENROLLMENT" | "ONE_ON_ONE_ENROLLMENT";
        referenceId: string;
        description: string;
        returnUrl: string;
        failUrl: string;
        metadata?: any;
    }): Promise<{ transactionId: string; paymentUrl?: string; message?: string }> {
        const { userId, amount, currency, method, referenceType, referenceId, description, returnUrl, failUrl, metadata } = payload;

        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        const transaction = new TransactionModel();
        transaction.amount = amount;
        transaction.currency = currency;
        transaction.method = method;
        transaction.referenceType = referenceType;
        transaction.referenceId = referenceId;
        transaction.description = description;
        transaction.user = user;
        transaction.status = TransactionStatus.PENDING;
        transaction.metadata = metadata;

        // Determine Provider based on Method
        if (method === PaymentMethod.SATIM) {
            transaction.provider = PaymentProvider.SATIM;
        } else if (method === PaymentMethod.WALLET) {
            transaction.provider = PaymentProvider.MANUAL; // Wallet is internal but handled as manual for provider tracking
        } else {
            transaction.provider = PaymentProvider.MANUAL;
        }

        const savedTransaction = await this.transactionRepo.save(transaction);

        if (method === PaymentMethod.SATIM) {
            // Initiate via Provider
            const response = await this.satimProvider.initiatePayment(
                amount,
                currency,
                savedTransaction.id, // Use transaction ID as order ID
                returnUrl,
                failUrl
            );

            savedTransaction.externalId = response.externalId;
            await this.transactionRepo.save(savedTransaction);

            return {
                transactionId: savedTransaction.id,
                paymentUrl: response.paymentUrl,
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
            };
        } else {
            // Manual Method (Baridimob or Transfer)
            return {
                transactionId: savedTransaction.id,
                message: "Please upload your payment receipt.",
            };
        }
    }

    async submitReceipt(transactionId: string, receiptUrl: string): Promise<TransactionModel> {
        const transaction = await this.transactionRepo.findOne({ where: { id: transactionId } });
        if (!transaction) throw new Error("Transaction not found");

        if (transaction.status !== TransactionStatus.PENDING && transaction.status !== TransactionStatus.FAILED) {
            throw new Error("Transaction cannot be updated");
        }

        transaction.receiptUrl = receiptUrl;
        transaction.status = TransactionStatus.PENDING_VERIFICATION;

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

        if (transaction.referenceType === "SUBSCRIPTION") {
            const { SubscriptionService } = await import("./subscription.service");
            const subscriptionService = new SubscriptionService();
            if (isSuccess) {
                await subscriptionService.activateSubscription(transaction.referenceId);
            } else {
                await subscriptionService.deactivateSubscription(transaction.referenceId);
            }

        } else if (transaction.referenceType === "COURSE_ENROLLMENT" || transaction.referenceType === "ONE_ON_ONE_ENROLLMENT") {
            // Handle Earnings if successful
            if (isSuccess && transaction.metadata?.teacherId) {
                await this.createEarningRecord(transaction);
            }

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

                fs.appendFileSync(debugPath, `[${new Date().toISOString()}] Attempting webhook: ${courseServiceUrl} payload: ${JSON.stringify(payload)} metadata: ${JSON.stringify(transaction.metadata)}\n`);
                log.info({ courseServiceUrl, transactionId: transaction.id }, "Notifying Course Service via webhook");

                const response = await axios.post(`${courseServiceUrl}/v1/payments/webhook`, payload, {
                    headers: {
                        "x-internal-api-key": process.env.INBOUND_API_KEY || "12345"
                    }
                });

                fs.appendFileSync(debugPath, `[${new Date().toISOString()}] Response: ${response.status} ${JSON.stringify(response.data)}\n`);
                log.info({ status: response.status, data: response.data }, "Course Service notified successfully");
            } catch (error: any) {
                const debugPath = path.join(process.cwd(), "user-webhook-debug.log");
                fs.appendFileSync(debugPath, `[${new Date().toISOString()}] ERROR: ${error.message} RESP: ${JSON.stringify(error.response?.data)}\n`);
                log.error({
                    err: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                }, "Failed to notify Course Service");
            }
        }
    }

    private async createEarningRecord(transaction: TransactionModel) {
        const { teacherId, courseType } = transaction.metadata;
        const totalAmount = transaction.amount;
        let feePercentage = 0;

        if (courseType === "one_on_one" || courseType === "prerecorded") {
            feePercentage = 0.08; // 8%
        } else if (courseType === "live" || courseType === "group") {
            // Check teacher subscription
            const subscription = await this.subscriptionRepo.findOne({
                where: { user: { id: teacherId }, status: "active" },
                relations: ["plan"]
            });

            // If teacher has no active subscription of 'basic', 'pro', or 'premium', maybe apply a default fee or handle differently
            // User said: live or group based on subscription ('basic', 'pro', 'premium')
            // I'll assume 0% fee if they have any of these active subscriptions.
            if (subscription && ["basic", "pro", "premium"].includes(subscription.plan?.type || "")) {
                feePercentage = 0;
            } else {
                // Default fee for live/group without subscription? User didn't specify. 
                // I'll assume 8% as well to be safe, or 10%. Let's go with 8% for now.
                feePercentage = 0.08;
            }
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

    async getWalletBalance(userId: string): Promise<UserWalletModel | null> {
        return await this.walletRepo.findOne({ where: { userId } });
    }

    async verifySatimTransaction(transactionId: string): Promise<TransactionStatus> {
        const transaction = await this.transactionRepo.findOne({ where: { id: transactionId } });
        if (!transaction) throw new Error("Transaction not found");

        // If already final, just return status
        if (transaction.status === TransactionStatus.SUCCESS || transaction.status === TransactionStatus.FAILED) {
            return transaction.status;
        }

        if (!transaction.externalId) {
            throw new Error("Cannot verify SATIM transaction: External ID missing");
        }

        const result = await this.satimProvider.verifyPayment(transaction.externalId);

        if (result.status === "success") {
            transaction.status = TransactionStatus.SUCCESS;
            const updated = await this.transactionRepo.save(transaction);
            await this.handlePostPayment(updated);
        } else if (result.status === "failed") {
            transaction.status = TransactionStatus.FAILED;
            const updated = await this.transactionRepo.save(transaction);
            await this.handlePostPayment(updated);
        }

        return transaction.status;
    }

    async refundToWallet(userId: string, amount: number, referenceType: string, referenceId: string): Promise<void> {
        log.info({ userId, amount, referenceType, referenceId }, "Processing refund to wallet");

        await AppDataSource.transaction(async (transactionalEntityManager) => {
            let wallet = await transactionalEntityManager.findOne(UserWalletModel, { where: { userId } });
            if (!wallet) {
                wallet = new UserWalletModel();
                wallet.userId = userId;
                wallet.totalEarned = 0;
                wallet.currentBalance = 0;
                wallet.frozenBalance = 0;
            }

            wallet.currentBalance = Number(wallet.currentBalance) + amount;
            await transactionalEntityManager.save(UserWalletModel, wallet);

            const walletTx = new WalletTransactionModel();
            walletTx.userId = userId;
            walletTx.amount = amount;
            walletTx.type = WalletTransactionType.CREDIT;
            walletTx.purpose = WalletTransactionPurpose.REFUND;
            walletTx.metadata = { referenceType, referenceId };
            await transactionalEntityManager.save(WalletTransactionModel, walletTx);
        });

        log.info({ userId, amount }, "Refund to wallet completed successfully");
    }
}
