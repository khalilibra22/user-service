import express from "express";
import { AvailabilityController } from "../../controllers/availability.controller";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { availabilityExceptionSchema } from "../../validations/availability.validation";

const router = express.Router({ mergeParams: true });

const availabilityController = new AvailabilityController();

router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "create"),
  ValidationMiddleware.validate(availabilityExceptionSchema),
  availabilityController.createAvailabilityException
);

// update availability exception
router.put(
  "/:exceptionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "update"),
  ValidationMiddleware.validate(availabilityExceptionSchema),
  availabilityController.updateAvailabilityException
);

// delete availability exception
router.delete(
  "/:exceptionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "delete"),
  availabilityController.deleteAvailabilityException
);

// get user's availability exceptions by user ID
router.get(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "list"),
  availabilityController.getTeacherAvailabilityExceptions
);

export { router as availabilityExceptionRouter };
