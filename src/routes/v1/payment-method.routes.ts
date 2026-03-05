import express from "express";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { UserController } from "../../controllers/user.controller";
import { paymentMethodValidationSchema } from "../../validations/user.validation";

const router = express.Router({ mergeParams: true });

const userController = new UserController();

//Add payment method to user
router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("payment_methods", "create"),
  ValidationMiddleware.validate(paymentMethodValidationSchema),
  userController.addPaymentMethod
);

// Update payment method
router.put(
  "/:paymentMethodId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("payment_methods", "update"),
  ValidationMiddleware.validate(paymentMethodValidationSchema),
  userController.updatePaymentMethod
);

// Get payment methods by user id
router.get(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelfOrAdmin,
  AuthMiddleware.authorize("payment_methods", "list"),
  userController.getPaymentMethodsByUserId
);

// Delete payment method
router.delete(
  "/:paymentMethodId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("payment_methods", "delete"),
  userController.deletePaymentMethod
);

export { router as paymentMethodRouter };
