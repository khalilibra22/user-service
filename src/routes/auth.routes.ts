import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  forgotPasswordSchema,
  loginValidationSchema,
  resetPasswordSchema,
  userValidationSchema,
} from "../validations/user.validation";
import { upload } from "../config/multer";
import passport from "passport";

const router = express.Router();

const authController = new AuthController();

router.post(
  "/",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  ValidationMiddleware.validate(userValidationSchema),
  async (req, res) => await authController.register(req, res)
);
router.post(
  "/login",
  ValidationMiddleware.validate(loginValidationSchema),
  async (req, res) => await authController.login(req, res)
);

router.post(
  "/forgot-password",
  ValidationMiddleware.validate(forgotPasswordSchema),
  async (req, res) => await authController.forgotPassword(req, res)
);

router.post(
  "/reset-password",
  ValidationMiddleware.validate(resetPasswordSchema),
  async (req, res) => await authController.resetPassword(req, res)
);

router.get(
  "/verify-email",
  async (req, res) => await authController.verifyEmail(req, res)
);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    session: true,
  }),
  async (req, res) => await authController.googleLogin(req, res)
);

router.get(
  "/logout",
  async (req, res) => await authController.logout(req, res)
);

router.get("/failure", (req, res) => {
  res.status(401).json({ message: "Authentication failed" });
});

export { router as authRouter };
