import express from "express";
import { container } from "../../container";
import { UserController } from "../../controllers/user.controller";
import { AvailabilityController } from "../../controllers/availability.controller";
import { AcademicBackgroundController } from "../../controllers/academic-background.controller";
import { SubscriptionQuotaService } from "../../services/subscription-quota.service";

const router = express.Router();

const userController = container.resolve(UserController);
const availabilityController = container.resolve(AvailabilityController);
const academicBackgroundController = container.resolve(AcademicBackgroundController);
const subscriptionQuotaService = container.resolve(SubscriptionQuotaService);

router.get(
  "/users/:id/minimal",
  userController.getUserMinimalInfo
);

router.get("/users/topics/:id", academicBackgroundController.getUserTopicById);
router.get("/subjects/:id", academicBackgroundController.getSubjectById);
router.get("/topics/:id", academicBackgroundController.getTopicById);

router.post("/availabilities/check", availabilityController.checkAvailabilitiesByIds);
router.put("/availabilities/update-to-unavailable", availabilityController.updateAvailabilitiesToUnavailable);
router.put("/availabilities/release", availabilityController.releaseAvailabilities);

/**
 * GET /inbounds/subscriptions/quota/:userId
 * Returns full quota info for a teacher.
 * Called by course-service before creating a group/live course.
 */
router.get("/subscriptions/quota/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const quota = await subscriptionQuotaService.getQuotaForUser(userId);
    res.status(200).json(quota);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get subscription quota" });
  }
});

export { router as inboundRouter };

