import express from "express";
import { PaymentController } from "../../controllers/payment.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { initiatePaymentSchema, submitReceiptSchema } from "../../validations/payment.validation";

const router = express.Router();
const paymentController = new PaymentController();

// Middlewares
const flexibleAuth = (req: any, res: any, next: any) => {
    const INBOUND_API_KEY = process.env.INBOUND_API_KEY;
    const providedKey = req.headers["x-internal-api-key"];

    if (INBOUND_API_KEY && providedKey === INBOUND_API_KEY) {
        return next();
    }
    return AuthMiddleware.verifyToken(req, res, next);
};

/** Strictly internal — rejects anything without the correct service-to-service API key. */
const requireInternalApiKey = (req: any, res: any, next: any) => {
    const INBOUND_API_KEY = process.env.INBOUND_API_KEY;
    const providedKey = req.headers["x-internal-api-key"];

    if (!INBOUND_API_KEY || providedKey !== INBOUND_API_KEY) {
        return res.status(403).json({ error: "Forbidden: internal service access only" });
    }
    return next();
};

router.post(
    "/initiate",
    flexibleAuth,
    ValidationMiddleware.validate(initiatePaymentSchema),
    paymentController.initiatePayment
);

router.post(
    "/:transactionId/receipt",
    AuthMiddleware.verifyToken,
    ValidationMiddleware.validate(submitReceiptSchema),
    paymentController.submitReceipt
);

router.get(
    "/user",
    AuthMiddleware.verifyToken,
    paymentController.getUserTransactions
);

router.get(
    "/reference/:type/:id",
    requireInternalApiKey,
    paymentController.getTransactionByReference
);

// Wallet & Refund routes
router.get(
    "/wallet/balance",
    AuthMiddleware.verifyToken,
    paymentController.getWalletBalance
);

router.post(
    "/refund/wallet",
    requireInternalApiKey,
    paymentController.refundToWallet
);

// Manual verify (kept for admin/debug use)
router.get(
    "/:transactionId/verify",
    AuthMiddleware.verifyToken,
    paymentController.verifyPayment
);

/**
 * PUBLIC — SATIM browser redirect callback.
 * SATIM redirects the user's browser here after payment (success or fail).
 * No JWT required — this is a browser redirect, not an API call.
 * Query params: transactionId (our internal ID)
 */
router.get(
    "/satim/callback",
    paymentController.satimCallback
);

export { router as paymentRouter };
