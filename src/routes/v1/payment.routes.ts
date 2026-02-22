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
    console.log(`[AUTH] payment.routes flexibleAuth check. Key in env: ${INBOUND_API_KEY}`);
    const providedKey = req.headers["x-internal-api-key"];
    console.log(`[AUTH] Provided key: ${providedKey}`);

    if (INBOUND_API_KEY && providedKey === INBOUND_API_KEY) {
        return next();
    }
    return AuthMiddleware.verifyToken(req, res, next);
};

// Public route? Or protected? Often payment initiation is protected.
// Assuming protected for now as we need userId.
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
    "/reference/:type/:id",
    flexibleAuth,
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
    flexibleAuth,
    // Add specific authorization if needed, e.g. Admin or Internal Service
    paymentController.refundToWallet
);

router.get(
    "/:transactionId/verify",
    AuthMiddleware.verifyToken,
    paymentController.verifyPayment
);

export { router as paymentRouter };
