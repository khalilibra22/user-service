import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { SubscriptionService } from "../services/subscription.service";
import { getLogger } from "../utils/logger";
import { TransactionStatus } from "../enums/transaction-status.enum";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const log = getLogger();

export class AdminPaymentController {
    private paymentService: PaymentService;
    private subscriptionService: SubscriptionService;

    constructor() {
        this.paymentService = new PaymentService();
        this.subscriptionService = new SubscriptionService();
    }

    validateTransaction = async (req: Request, res: Response): Promise<void> => {
        try {
            const { transactionId } = req.params;
            const { status, adminNote } = req.body; // status: 'success' | 'failed'

            const debugPath = path.join(process.cwd(), "admin-debug.log");
            fs.appendFileSync(debugPath, `[${new Date().toISOString()}] Admin validate: ${transactionId} status: ${status}\n`);

            if (status !== TransactionStatus.SUCCESS && status !== TransactionStatus.FAILED) {
                res.status(400).json({ error: "Invalid status" });
                return;
            }

            const transaction = await this.paymentService.validateManualTransaction(transactionId, status, adminNote);

            if (status === TransactionStatus.SUCCESS) {
                await this.handlePaymentSuccess(transaction);
            }

            res.status(200).json(transaction);
        } catch (error: any) {
            log.error({ err: error }, "Error validating transaction");
            res.status(500).json({ error: error.message });
        }
    };

    private async handlePaymentSuccess(transaction: any) {
        if (transaction.referenceType === "SUBSCRIPTION") {
            // Update Subscription
            // We need a method in SubscriptionService to update status by ID? 
            // Or we update it manually here via helper?
            // Ideally SubscriptionService.activateSubscription(user, plan) logic.
            // But here we have the referenceId which is likely the SubscriptionId or PlanId?
            // In initiatePayment, referenceId should be SubscriptionID (if created pending) OR PlanID (if new)?

            // If we follow the flow: User clicks "Subscribe", we create a Pending Subscription AND a Pending Transaction.
            // So referenceId = SubscriptionId.

            // We need SubscriptionService to have `updateStatus(id, status)`
            await this.subscriptionService.activateSubscription(transaction.referenceId);

            // Handled by PaymentService.handlePostPayment via validateManualTransaction
        }
    }
}
