import express from "express";
import { AvailabilityController } from "../../controllers/availability.controller";

const router = express.Router();

const availabilityController = new AvailabilityController();
router.post("/check", async (req, res) =>
  availabilityController.checkAvailabilitiesByIds(req, res)
);

//updateAvailabilitiesToUnavailable
router.patch(
  "/bulk-unavailable",
  //AuthMiddleware.verifyToken,
  async (req, res) =>
    availabilityController.updateAvailabilitiesToUnavailable(req, res)
);

export { router as availabilityRouter };
