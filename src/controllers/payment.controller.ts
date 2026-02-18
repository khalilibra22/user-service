import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { SubscriptionService } from "../services/subscription.service";
import { getLogger } from "../utils/logger";


const log = getLogger();

export class PaymentController {
    private paymentService: PaymentService;
    private subscriptionService: SubscriptionService;

    constructor() {
        this.paymentService = new PaymentService();
        this.subscriptionService = new SubscriptionService();
    }

    initiatePayment = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId, amount, currency, method, referenceType, referenceId, description, returnUrl, failUrl } = req.body;

            const result = await this.paymentService.initiateTransaction({
                userId,
                amount,
                currency,
                method,
                referenceType,
                referenceId,
                description,
                returnUrl,
                failUrl
            });

            res.status(201).json(result);
        } catch (error: any) {
            log.error({ err: error }, "Error initiating payment");
            res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    };

    submitReceipt = async (req: Request, res: Response): Promise<void> => {
        try {
            const { transactionId } = req.params;
            const { receiptUrl } = req.body;

            const transaction = await this.paymentService.submitReceipt(transactionId, receiptUrl);
            res.status(200).json(transaction);
        } catch (error: any) {
            log.error({ err: error }, "Error submitting receipt");
            res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    }

    // Called by UI after redirect from SATIM
    verifyPayment = async (req: Request, res: Response): Promise<void> => {
        try {
            const { transactionId } = req.params;

            // Call PaymentService to verify transaction with SATIM provider
            const status = await this.paymentService.verifySatimTransaction(transactionId);

            res.status(200).json({ status, message: `Payment status: ${status}` });
        } catch (error: any) {
            log.error({ err: error }, "Error verifying payment");
            res.status(500).json({ error: error.message });
        }
    }

    getTransactionByReference = async (req: Request, res: Response): Promise<void> => {
        try {
            const { type, id } = req.params;
            const transaction = await this.paymentService.getTransactionByReference(type, id);
            if (!transaction) {
                res.status(404).json({ error: "Transaction not found" });
                return;
            }
            res.status(200).json(transaction);
        } catch (error: any) {
            log.error({ err: error }, "Error getting transaction by reference");
            res.status(500).json({ error: error.message });
        }
    }
}
