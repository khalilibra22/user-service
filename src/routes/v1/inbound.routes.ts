import express from "express";
import { UserController } from "../../controllers/user.controller";
import { AvailabilityController } from "../../controllers/availability.controller";
import { AcademicBackgroundController } from "../../controllers/academic-background.controller";

const router = express.Router();

const userController = new UserController();
const availabilityController = new AvailabilityController();
const academicBackgroundController = new AcademicBackgroundController();

router.get(
  "/users/:id/minimal",
  //AuthMiddleware.verifyToken,
  userController.getUserMinimalInfo
);

router.get(
    "/users/topics/:id",
    academicBackgroundController.getUserTopicById
  );

router.post(
  "/availabilities/check",
  availabilityController.checkAvailabilitiesByIds
);

router.post(
  "/availabilities/update-to-unavailable",
  availabilityController.updateAvailabilitiesToUnavailable
);

export { router as inboundRouter };
