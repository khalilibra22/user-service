import express from "express";
import { AuthMiddleware } from "../utils/auth.middleware";
import { AvailabilityController } from "../controllers/availability.controller";

const router = express.Router();

const availabilityController = new AvailabilityController();

router.post("/check", async (req, res) =>
  availabilityController.checkAvailabilitiesByIds(req, res)
);

export { router as availabilityRouter };
