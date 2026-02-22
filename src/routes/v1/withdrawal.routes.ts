import { Router } from "express";
import { WithdrawalController } from "../../controllers/withdrawal.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { withdrawalRequestSchema, adminWithdrawalUpdateSchema } from "../../validations/withdrawal.validation";

const router = Router();
const withdrawalController = new WithdrawalController();

/**
 * Teacher Routes
 */

// Get balance
router.get(
    "/balance",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("withdrawals", "read"),
    withdrawalController.getTeacherBalance
);

// Request withdrawal
router.post(
    "/request",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("withdrawals", "create"),
    ValidationMiddleware.validate(withdrawalRequestSchema),
    withdrawalController.requestWithdrawal
);

// Get withdrawal history
router.get(
    "/history",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("withdrawals", "read"),
    withdrawalController.getTeacherWithdrawals
);

/**
 * Admin Routes
 */

// Get all requests
router.get(
    "/admin/requests",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("withdrawals", "list"),
    withdrawalController.adminGetAllRequests
);

// Update request status (Approve, Reject, Pay)
router.put(
    "/admin/requests/:id/status",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("withdrawals", "approve"),
    ValidationMiddleware.validate(adminWithdrawalUpdateSchema),
    withdrawalController.adminUpdateStatus
);

export default router;
