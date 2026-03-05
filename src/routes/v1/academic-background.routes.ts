import express from "express";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import {
  academicBackgroundSchema,
  updateAcademicBackgroundSchema,
} from "../../validations/academic-background.validation";
import { AcademicBackgroundController } from "../../controllers/academic-background.controller";

const router = express.Router({ mergeParams: true });

const academicBackgroundController = new AcademicBackgroundController();
// Create user's academic background
router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("academic_backgrounds", "create"),
  ValidationMiddleware.validate(academicBackgroundSchema),
  academicBackgroundController.createAcademicBackground
);

// Update user's academic background
router.put(
  "/:academicBackgroundId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("academic_backgrounds", "update"),
  ValidationMiddleware.validate(updateAcademicBackgroundSchema),
  academicBackgroundController.updateAcademicBackground
);

// Delete user's academic background
router.delete(
  "/:academicBackgroundId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("academic_backgrounds", "delete"),
  academicBackgroundController.deleteAcademicBackground
);

// Get user's academic background by user ID
router.get(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("academic_backgrounds", "list"),
  academicBackgroundController.getAcademicBackgroundByUserId
);

export { router as academicBackgroundRouter };
