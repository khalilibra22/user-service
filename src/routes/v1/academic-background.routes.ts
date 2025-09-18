import express from "express";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { academicBackgroundSchema, updateAcademicBackgroundSchema } from "../../validations/academic-background.validation";
import { AcademicBackgroundController } from "../../controllers/academic-background.controller";

const router = express.Router();

const academicBackgroundController = new AcademicBackgroundController();
// Create user's academic background
router.post(
    "/",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("academic_backgrounds", "create"),
    ValidationMiddleware.validate(academicBackgroundSchema),
    async (req, res) =>
      academicBackgroundController.createAcademicBackground(req, res)
  );
  
  // Update user's academic background
  router.put(
    "/:academicBackgroundId",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("academic_backgrounds", "update"),
    ValidationMiddleware.validate(updateAcademicBackgroundSchema),
    async (req, res) =>
      academicBackgroundController.updateAcademicBackground(req, res)
  );
  
  // Delete user's academic background
  router.delete(
    "/:academicBackgroundId",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("academic_backgrounds", "delete"),
    async (req, res) =>
      academicBackgroundController.deleteAcademicBackground(req, res)
  );
  
  // Get user's academic background by user ID
  router.get(
    "/",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("academic_backgrounds", "list"),
    async (req, res) =>
      academicBackgroundController.getAcademicBackgroundByUserId(req, res)
  );
  
export { router as academicBackgroundRouter };