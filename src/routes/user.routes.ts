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

export { router as userRouter };
