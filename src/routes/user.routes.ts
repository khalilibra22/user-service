import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { updateUserValidationSchema } from "../validation/user.validation";
import { UserController } from "../controllers/user.controller";
import { AuthMiddleware } from "../utils/auth.middleware";

const router = express.Router();

const userController = new UserController();

const userValidationMiddleware = new ValidationMiddleware(
  updateUserValidationSchema
);

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  userValidationMiddleware.validate(),
  async (req, res) => await userController.updateUser(req, res)
);

router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.getUserById(req, res)
);

router.post(
  "/:id/check-permissions",
  async (req, res) => await userController.checkPermissions(req, res)
);

//Add topic to user
router.post(
  "/:id/topics",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.addTopicToUser(req, res)
);

// Get topics by user id
router.get(
  "/:id/topics",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.getTopicsByUserId(req, res)
);

export { router as userRouter };
