import express from "express";
import { container } from "../../container";
import { AvailabilityController } from "../../controllers/availability.controller";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { availabilitySchema } from "../../validations/availability.validation";

const router = express.Router({ mergeParams: true });

const availabilityController = container.resolve(AvailabilityController);

// create availability
router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("availabilities", "create"),
  ValidationMiddleware.validate(availabilitySchema),
  availabilityController.createAvailability
);

// update availability
router.put(
  "/:availabilityId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("availabilities", "update"),
  ValidationMiddleware.validate(availabilitySchema),
  availabilityController.updateAvailability
);

// delete availability
router.delete(
  "/:availabilityId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("availabilities", "delete"),
  availabilityController.deleteAvailability
);

// get user's availability by user ID
router.get(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "list"),
  availabilityController.getTeacherAvailability
);

// Deactivate all availabilities for user
router.patch(
  "/deactivate-all",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("availabilities", "toggle"),
  availabilityController.deactivateAllAvailabilities
);

// Activate all availabilities for user
router.patch(
  "/activate-all",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("availabilities", "toggle"),
  availabilityController.activateAllAvailabilities
);

// Toggle availability status
router.patch(
  "/:availabilityId/toggle-status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("availabilities", "toggle"),
  availabilityController.toggleAvailabilityStatus
);

export { router as availabilityRouter };

