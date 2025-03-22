import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  loginValidationSchema,
  userValidationSchema,
} from "../validation/user.validation";
import { upload } from "../config/multer";

const router = express.Router();

const authController = new AuthController();
const authValidationMiddleware = new ValidationMiddleware(userValidationSchema);
const loginValidationMiddleware = new ValidationMiddleware(
  loginValidationSchema
);

router.post(
  "/",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  authValidationMiddleware.validate(),
  async (req, res) => await authController.register(req, res)
);
router.post(
  "/login",
  loginValidationMiddleware.validate(),
  async (req, res) => await authController.login(req, res)
);

router.post(
  "/forgot-password",
  async (req, res) => await authController.forgotPassword(req, res)
);

router.post(
  "/reset-password",
  async (req, res) => await authController.resetPassword(req, res)
);

router.get(
  "/verify-email",
  async (req, res) => await authController.verifyEmail(req, res)
);

export { router as authRouter };
