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

const log = getLogger();

export class PaymentService {
    private transactionRepo: Repository<TransactionModel>;
    private userRepo: Repository<UserModel>;
    private satimProvider: SatimProvider;

    constructor() {
        this.transactionRepo = AppDataSource.getRepository(TransactionModel);
        this.userRepo = AppDataSource.getRepository(UserModel);
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
    }): Promise<{ transactionId: string; paymentUrl?: string; message?: string }> {
        const { userId, amount, currency, method, referenceType, referenceId, description, returnUrl, failUrl } = payload;

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

        // Determine Provider based on Method
        if (method === PaymentMethod.SATIM) {
            transaction.provider = PaymentProvider.SATIM;
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
        log.info({ transactionId: transaction.id, type: transaction.referenceType, status: transaction.status }, "Handling post-payment logic");

        const isSuccess = transaction.status === TransactionStatus.SUCCESS;

        if (transaction.referenceType === "SUBSCRIPTION") {
            const { SubscriptionService } = await import("./subscription.service");
            const subscriptionService = new SubscriptionService();
            if (isSuccess) {
                await subscriptionService.activateSubscription(transaction.referenceId);
            } else {
                await subscriptionService.deactivateSubscription(transaction.referenceId);
            }

        } else if (transaction.referenceType === "COURSE_ENROLLMENT" || transaction.referenceType === "ONE_ON_ONE_ENROLLMENT") {
            try {
                const courseServiceUrl = process.env.COURSE_SERVICE_URL || "http://localhost:3002";
                await axios.post(`${courseServiceUrl}/v1/payments/webhook`, {
                    transactionId: transaction.id,
                    referenceId: transaction.referenceId,
                    referenceType: transaction.referenceType,
                    status: isSuccess ? "success" : "failed"
                });
            } catch (error) {
                log.error({ err: error }, "Failed to notify Course Service");
            }
        }
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
}
