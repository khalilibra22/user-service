import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { AuthMiddleware } from "../utils/auth.middleware";
import { SubscriptionController } from "../controllers/subscription.controller";

const router = express.Router();

const subscriptionController = new SubscriptionController();

router.post(
  "/plans",
  AuthMiddleware.verifyToken,
  //userValidationMiddleware.validate(),
  async (req, res) => await subscriptionController.createPlan(req, res)
);

// Create a new subscription for a specific plan
// The plan ID is passed as a URL parameter
// The user ID is passed in the request body
router.post(
  "/:planId",
  AuthMiddleware.verifyToken,
  async (req, res) => await subscriptionController.createSubscription(req, res)
);

router.get(
  "/plans",
  AuthMiddleware.verifyToken,
  async (req, res) => await subscriptionController.getPlans(req, res)
);

export { router as subscriptionRouter };
