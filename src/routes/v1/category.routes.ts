import express from "express";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { AcademicBackgroundController } from "../../controllers/academicBackground.controller";
import { taxonomyValidationSchema } from "../../validations/academicBackground.validation";

const router = express.Router();

const academicBackgroundController = new AcademicBackgroundController();

router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "create"),
  ValidationMiddleware.validate(taxonomyValidationSchema),
  async (req, res) =>
    await academicBackgroundController.createCategory(req, res)
);

router.get(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "list"),
  async (req, res) => await academicBackgroundController.getCategories(req, res)
);

router.post(
  "/:categoryId/subjects",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "create"),
  ValidationMiddleware.validate(taxonomyValidationSchema),
  async (req, res) => await academicBackgroundController.createSubject(req, res)
);

router.post(
  "/:categoryId/subjects/:subjectId/topics",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "create"),
  ValidationMiddleware.validate(taxonomyValidationSchema),
  async (req, res) => await academicBackgroundController.createTopic(req, res)
);

router.delete(
  "/:categoryId/subjects/:subjectId/topics/:topicId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "delete"),
  async (req, res) => await academicBackgroundController.deleteTopic(req, res)
);

router.put(
  "/:categoryId/subjects/:subjectId/topics/:topicId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "update"),
  ValidationMiddleware.validate(taxonomyValidationSchema),
  async (req, res) => await academicBackgroundController.updateTopic(req, res)
);

router.patch(
  "/:categoryId/subjects/:subjectId/topics/:topicId/toggle-status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "update"),
  async (req, res) =>
    await academicBackgroundController.toggleTopicStatus(req, res)
);
export { router as categoriesRouter };
