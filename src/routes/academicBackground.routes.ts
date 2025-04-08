import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { AuthMiddleware } from "../utils/auth.middleware";
import { AcademicBackgroundController } from "../controllers/academicBackground.controller";
import {
  academicBackgroundSchema,
  createCategorySchema,
  createSubjectSchema,
  createTopicSchema,
} from "../validation/academicBackground.validation";

const router = express.Router();

const academicBackgroundController = new AcademicBackgroundController();

router.post(
  "/",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(academicBackgroundSchema),
  async (req, res) =>
    await academicBackgroundController.createAcademicBackground(req, res)
);

router.post(
  "/categories",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(createCategorySchema),
  async (req, res) =>
    await academicBackgroundController.createCategory(req, res)
);

router.get(
  "/categories",
  AuthMiddleware.verifyToken,
  async (req, res) => await academicBackgroundController.getCategories(req, res)
);

router.post(
  "/subjects",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(createSubjectSchema),
  async (req, res) => await academicBackgroundController.createSubject(req, res)
);

router.post(
  "/topics",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(createTopicSchema),
  async (req, res) => await academicBackgroundController.createTopic(req, res)
);

export { router as academicBackgroundRouter };
