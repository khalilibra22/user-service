import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { AuthMiddleware } from "../utils/auth.middleware";
import { AcademicBackgroundController } from "../controllers/academicBackground.controller";
import { taxonomyValidationSchema } from "../validations/academicBackground.validation";

const router = express.Router();

const academicBackgroundController = new AcademicBackgroundController();

router.post(
  "/",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(taxonomyValidationSchema),
  async (req, res) =>
    await academicBackgroundController.createCategory(req, res)
);

router.get(
  "/",
  AuthMiddleware.verifyToken,
  async (req, res) => await academicBackgroundController.getCategories(req, res)
);

router.post(
  "/:id/subjects",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(taxonomyValidationSchema),
  async (req, res) => await academicBackgroundController.createSubject(req, res)
);

router.post(
  "/:id/subjects/:subjectId/topics",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(taxonomyValidationSchema),
  async (req, res) => await academicBackgroundController.createTopic(req, res)
);

export { router as categoriesRouter };
