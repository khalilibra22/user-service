import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  loginValidationSchema,
  userValidationSchema,
} from "../validation/user.validation";

const router = express.Router();

const authController = new AuthController();
const authValidationMiddleware = new ValidationMiddleware(userValidationSchema);
const loginValidationMiddleware = new ValidationMiddleware(
  loginValidationSchema
);

router.post(
  "/",
  authValidationMiddleware.validate(),
  async (req, res) => await authController.register(req, res)
);
router.post(
  "/login",
  loginValidationMiddleware.validate(),
  async (req, res) => await authController.login(req, res)
);

export { router as authRouter };
