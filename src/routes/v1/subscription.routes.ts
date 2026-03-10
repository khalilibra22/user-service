import express from "express";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { SubscriptionController } from "../../controllers/subscription.controller";
import {
  planSValdationSchema,
  updatePlanValidationSchema,
  userSubscriptionValidationSchema,
} from "../../validations/subscription.validation";

const router = express.Router();

const subscriptionController = new SubscriptionController();

// ─── Plans ────────────────────────────────────────────────────────────────────

// Public: list all active plans (no auth required — users need to browse plans before subscribing)
router.get("/plans", subscriptionController.getPlans);

// Admin: create a new plan
router.post(
  "/plans",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "create"),
  ValidationMiddleware.validate(planSValdationSchema),
  subscriptionController.createPlan
);

// Admin: update a plan
router.patch(
  "/plans/:planId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "create"),
  ValidationMiddleware.validate(updatePlanValidationSchema),
  subscriptionController.updatePlan
);

// Admin: deactivate (soft-delete) a plan
router.delete(
  "/plans/:planId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "create"),
  subscriptionController.deactivatePlan
);

// ─── Subscriptions ────────────────────────────────────────────────────────────

// Admin: get all active subscriptions
router.get(
  "/active",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "list"),
  subscriptionController.getActiveSubscriptions
);

// User: get all subscriptions for a specific user (self or admin)
router.get(
  "/users/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelfOrAdmin,
  AuthMiddleware.authorize("subscriptions", "view"),
  subscriptionController.getUserSubscriptions
);

// User: cancel their own subscription
router.patch(
  "/:subscriptionId/cancel",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "subscribe"),
  subscriptionController.cancelSubscription
);

// User: renew current subscription (same plan, new billing period)
router.post(
  "/renew",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "subscribe"),
  ValidationMiddleware.validate(userSubscriptionValidationSchema),
  subscriptionController.renewSubscription
);

// User: upgrade to a higher-tier plan (immediate, payment required)
router.post(
  "/upgrade/:planId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "subscribe"),
  ValidationMiddleware.validate(userSubscriptionValidationSchema),
  subscriptionController.upgradeSubscription
);

// User: downgrade to a lower-tier plan (takes effect at end of billing period, no payment)
router.post(
  "/downgrade/:planId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "subscribe"),
  ValidationMiddleware.validate(userSubscriptionValidationSchema),
  subscriptionController.downgradeSubscription
);

// User: create a new subscription for a specific plan
// The plan ID is passed as a URL parameter, user ID in the request body
router.post(
  "/:planId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "subscribe"),
  ValidationMiddleware.validate(userSubscriptionValidationSchema),
  subscriptionController.createSubscription
);

export { router as subscriptionRouter };
