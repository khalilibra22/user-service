import express from "express";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { addTopicToUserValidationSchema } from "../../validations/user.validation";
import { AcademicBackgroundController } from "../../controllers/academic-background.controller";

const router = express.Router();
const academicBackgroundController = new AcademicBackgroundController();


router.post(
    "/:topicId",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("catalogs", "pick"),
    ValidationMiddleware.validate(addTopicToUserValidationSchema),
    academicBackgroundController.addTopicToUser
  );
  
  // Update topic price for user
  router.put(
    "/:topicId",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("catalogs", "adjust"),
    ValidationMiddleware.validate(addTopicToUserValidationSchema),
    academicBackgroundController.updateUserTopicPrice
  );
  
  // Delete topic from user
  router.delete(
    "/:topicId",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("catalogs", "drop"),
    academicBackgroundController.deleteUserTopic
  );
  
  // Get topics by user id
  router.get(
    "/",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("catalogs", "view"),
    academicBackgroundController.getTopicsByUserId
  );

  // Toggle topic status for user
router.patch(
    "/:topicId/toggle-status",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("catalogs", "toggle"),
    academicBackgroundController.toggleUserTopicStatus
  );

export { router as topicRouter };

  