import express from "express";
import { AvailabilityController } from "../../controllers/availability.controller";

const router = express.Router();

const availabilityController = new AvailabilityController();
router.post("/check", availabilityController.checkAvailabilitiesByIds);

//updateAvailabilitiesToUnavailable
router.patch(
  "/bulk-unavailable",
  //AuthMiddleware.verifyToken,
  availabilityController.updateAvailabilitiesToUnavailable
);

export { router as availabilityRouter };
