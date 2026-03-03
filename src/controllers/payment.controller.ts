import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { SubscriptionService } from "../services/subscription.service";
import { NotificationService } from "../services/notification.service";
import { getLogger } from "../utils/logger";


const log = getLogger();

export class PaymentController {
    private paymentService: PaymentService;
    private subscriptionService: SubscriptionService;
    private notificationService: NotificationService;

    constructor() {
        this.paymentService = new PaymentService();
        this.subscriptionService = new SubscriptionService();
        this.notificationService = new NotificationService();
    }

    initiatePayment = async (req: Request, res: Response): Promise<void> => {
        try {
            const INBOUND_API_KEY = process.env.INBOUND_API_KEY;
            const providedKey = req.headers["x-internal-api-key"];
            const isInternal = INBOUND_API_KEY && providedKey === INBOUND_API_KEY;

            let userId;
            if (isInternal && req.body.userId) {
                userId = req.body.userId;
            } else {
                userId = res.locals.user?.id;
            }

            if (!userId) {
                res.status(401).json({ error: "Unauthorized: UserId required" });
                return;
            }

            const { amount, currency, method, referenceType, referenceId, description, returnUrl, failUrl, metadata } = req.body;

            const result = await this.paymentService.initiateTransaction({
                userId,
                amount,
                currency,
                method,
                referenceType,
                referenceId,
                description,
                returnUrl,
                failUrl,
                metadata
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

    // Called by UI after redirect from SATIM (kept for manual/API use)
    verifyPayment = async (req: Request, res: Response): Promise<void> => {
        try {
            const { transactionId } = req.params;
            const status = await this.paymentService.verifySatimTransaction(transactionId);
            res.status(200).json({ status, message: `Payment status: ${status}` });
        } catch (error: any) {
            log.error({ err: error }, "Error verifying payment");
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * SATIM Callback — browser redirect target after payment.
     * SATIM redirects the user's browser here automatically (no frontend action needed).
     * SATIM appends its own `orderId` to our returnUrl, we use it directly for reliable verification.
     * This endpoint is PUBLIC — no JWT required.
     */
    satimCallback = async (req: Request, res: Response): Promise<void> => {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const { transactionId, orderId } = req.query as { transactionId?: string; orderId?: string };

        log.info({ transactionId, orderId }, "SATIM callback received");

        if (!transactionId) {
            log.warn("SATIM callback received without transactionId");
            const html = this.notificationService.renderTemplate("satim-fail", {
                frontendUrl,
                reason: "Référence de transaction manquante.",
            });
            res.status(400).send(html);
            return;
        }

        try {
            const { status, transaction } = await this.paymentService.verifySatimTransaction(transactionId, orderId);

            // Format date nicely
            const paidAt = transaction.createdAt
                ? new Date(transaction.createdAt).toLocaleString("fr-FR", {
                    day: "2-digit", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                })
                : null;

            // Map referenceType to a readable label
            const referenceLabels: Record<string, string> = {
                COURSE_ENROLLMENT: "Inscription au cours",
                ONE_ON_ONE_ENROLLMENT: "Session individuelle",
                SUBSCRIPTION: "Abonnement",
            };

            const receiptData = {
                frontendUrl,
                transactionId: transaction.id,
                amount: Number(transaction.amount).toFixed(2),
                currency: transaction.currency || "DZD",
                description: transaction.description || "",
                referenceType: referenceLabels[transaction.referenceType] || transaction.referenceType,
                paidAt,
                externalId: transaction.externalId || "",
            };

            if (status === "success") {
                const html = this.notificationService.renderTemplate("satim-success", receiptData);
                res.status(200).send(html);
            } else {
                const html = this.notificationService.renderTemplate("satim-fail", {
                    ...receiptData,
                    reason: status === "pending" ? "Paiement en attente de confirmation." : "Paiement refusé ou annulé.",
                });
                res.status(200).send(html);
            }
        } catch (error: any) {
            log.error({ err: error, transactionId }, "Error in SATIM callback");
            const html = this.notificationService.renderTemplate("satim-fail", {
                frontendUrl,
                transactionId,
                reason: "Une erreur interne est survenue.",
            });
            res.status(500).send(html);
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

    refundToWallet = async (req: Request, res: Response): Promise<void> => {
        try {
            // Check if it's an internal service call via API Key
            const INBOUND_API_KEY = process.env.INBOUND_API_KEY;
            const providedKey = req.headers["x-internal-api-key"];
            const isInternal = INBOUND_API_KEY && providedKey === INBOUND_API_KEY;

            let userId;
            if (isInternal) {
                // If internal, trust the userId in body
                userId = req.body.userId;
            } else {
                // If not internal, it must be the user themselves (or we should block this entirely for public)
                userId = res.locals.user?.id;
            }

            if (!userId) {
                res.status(401).json({ error: "Unauthorized: UserId required" });
                return;
            }

            const { amount, referenceType, referenceId } = req.body;
            await this.paymentService.refundToWallet(userId, amount, referenceType, referenceId);
            res.status(200).json({ message: "Refund processed successfully to student wallet." });
        } catch (error: any) {
            log.error({ err: error }, "Error processing refund to wallet");
            res.status(500).json({ error: error.message });
        }
    }

    getWalletBalance = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = res.locals.user.id;
            const balance = await this.paymentService.getWalletBalance(userId);
            res.status(200).json(balance || { userId, currentBalance: 0, frozenBalance: 0, totalEarned: 0 });
        } catch (error: any) {
            log.error({ err: error }, "Error getting wallet balance");
            res.status(500).json({ error: error.message });
        }
    }
}
