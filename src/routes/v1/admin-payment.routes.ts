import express from "express";
import { AdminPaymentController } from "../../controllers/admin-payment.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { validateTransactionSchema } from "../../validations/payment.validation";

const router = express.Router();
const adminPaymentController = new AdminPaymentController();

router.post(
    "/:transactionId/validate",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("payments", "validate"), // Assuming 'payments' resource and 'validate' action
    ValidationMiddleware.validate(validateTransactionSchema),
    adminPaymentController.validateTransaction
);

export { router as adminPaymentRouter };
