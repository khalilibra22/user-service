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
  async (req, res) => await subscriptionController.createPlan(req, res)
);

// Create a new subscription for a specific plan
// The plan ID is passed as a URL parameter
// The user ID is passed in the request body
router.post(
  "/:planId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "subscribe"),
  ValidationMiddleware.validate(userSubscriptionValidationSchema),
  async (req, res) => await subscriptionController.createSubscription(req, res)
);

router.get(
  "/plans",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "view"),
  async (req, res) => await subscriptionController.getPlans(req, res)
);

router.get(
  "/active",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "list"),
  async (req, res) =>
    await subscriptionController.getActiveSubscriptions(req, res)
);

export { router as subscriptionRouter };
