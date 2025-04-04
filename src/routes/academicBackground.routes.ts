import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { AuthMiddleware } from "../utils/auth.middleware";
import { AcademicBackgroundController } from "../controllers/academicBackground.controller";

const router = express.Router();

const academicBackgroundController = new AcademicBackgroundController();

router.post(
  "/",
  AuthMiddleware.verifyToken,
  //userValidationMiddleware.validate(),
  async (req, res) =>
    await academicBackgroundController.createAcademicBackground(req, res)
);

router.post(
  "/categories",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await academicBackgroundController.createCategory(req, res)
);

router.post(
  "/subjects",
  AuthMiddleware.verifyToken,
  async (req, res) => await academicBackgroundController.createSubject(req, res)
);

router.post(
  "/topics",
  AuthMiddleware.verifyToken,
  async (req, res) => await academicBackgroundController.createTopic(req, res)
);

export { router as academicBackgroundRouter };
