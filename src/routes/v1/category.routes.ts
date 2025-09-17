import express from "express";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { AcademicBackgroundController } from "../../controllers/academic-background.controller";
import { taxonomyValidationSchema } from "../../validations/academic-background.validation";

const router = express.Router();

const academicBackgroundController = new AcademicBackgroundController();

router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "create"),
  ValidationMiddleware.validate(taxonomyValidationSchema),
  academicBackgroundController.createCategory
);

router.get(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "list"),
  academicBackgroundController.getCategories
);

router.post(
  "/:categoryId/subjects",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "create"),
  ValidationMiddleware.validate(taxonomyValidationSchema),
  academicBackgroundController.createSubject
);

router.post(
  "/:categoryId/subjects/:subjectId/topics",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "create"),
  ValidationMiddleware.validate(taxonomyValidationSchema),
  academicBackgroundController.createTopic
);

router.delete(
  "/:categoryId/subjects/:subjectId/topics/:topicId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "delete"),
  academicBackgroundController.deleteTopic
);

router.put(
  "/:categoryId/subjects/:subjectId/topics/:topicId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "update"),
  ValidationMiddleware.validate(taxonomyValidationSchema),
  academicBackgroundController.updateTopic
);

router.patch(
  "/:categoryId/subjects/:subjectId/topics/:topicId/toggle-status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "update"),
  academicBackgroundController.toggleTopicStatus
);
export { router as categoriesRouter };
