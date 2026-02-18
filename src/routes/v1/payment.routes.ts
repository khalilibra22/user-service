import express from "express";
import { PaymentController } from "../../controllers/payment.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { initiatePaymentSchema, submitReceiptSchema } from "../../validations/payment.validation";

const router = express.Router();
const paymentController = new PaymentController();

// Public route? Or protected? Often payment initiation is protected.
// Assuming protected for now as we need userId.
router.post(
    "/initiate",
    AuthMiddleware.verifyToken,
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
    AuthMiddleware.verifyToken,
    paymentController.getTransactionByReference
);

// Wallet & Refund routes
router.get(
    "/wallet/balance/:userId",
    AuthMiddleware.verifyToken,
    paymentController.getWalletBalance
);

router.post(
    "/refund/wallet",
    AuthMiddleware.verifyToken,
    // Add specific authorization if needed, e.g. Admin or Internal Service
    paymentController.refundToWallet
);

router.get(
    "/:transactionId/verify",
    AuthMiddleware.verifyToken,
    paymentController.verifyPayment
);

export { router as paymentRouter };
