import express from "express";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { SubscriptionController } from "../../controllers/subscription.controller";
import {
  planSValdationSchema,
  userSubscriptionValidationSchema,
} from "../../validations/subscription.validation";

const router = express.Router();

const subscriptionController = new SubscriptionController();

router.post(
  "/plans",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "create"),
  ValidationMiddleware.validate(planSValdationSchema),
  subscriptionController.createPlan
);

// Create a new subscription for a specific plan
// The plan ID is passed as a URL parameter
// The user ID is passed in the request body
router.post(
  "/:planId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "subscribe"),
  ValidationMiddleware.validate(userSubscriptionValidationSchema),
  subscriptionController.createSubscription
);

router.get(
  "/plans",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "view"),
  subscriptionController.getPlans
);

router.get(
  "/active",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "list"),
  subscriptionController.getActiveSubscriptions
);

export { router as subscriptionRouter };
