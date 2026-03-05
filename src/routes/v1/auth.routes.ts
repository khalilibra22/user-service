import express from "express";
import { AuthController } from "../../controllers/auth.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import {
  changeEmailSchema,
  forgotPasswordSchema,
  loginValidationSchema,
  resetPasswordSchema,
  userValidationSchema,
} from "../../validations/user.validation";
import { uploadMemory } from "../../config/multer";
import { s3UploadMiddleware } from "../../middlewares/s3-upload.middleware";
import { validateFileUploads } from "../../middlewares/file-validation.middleware";
import { loginLimiter, forgotPasswordLimiter } from "../../config/rate-limit";
import passport from "passport";

const router = express.Router();

const authController = new AuthController();


router.post(
  "/",
  uploadMemory.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  ValidationMiddleware.validate(userValidationSchema),
  validateFileUploads,
  s3UploadMiddleware,
  authController.register
);
router.post(
  "/login",
  loginLimiter,
  ValidationMiddleware.validate(loginValidationSchema),
  authController.login
);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  ValidationMiddleware.validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/reset-password",
  ValidationMiddleware.validate(resetPasswordSchema),
  authController.resetPassword
);

router.get(
  "/verify-email",
  authController.verifyEmail
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
  authController.googleLogin
);

router.get(
  "/logout",
  authController.logout
);

router.get("/failure", (req, res) => {
  res.status(401).json({ message: "Authentication failed" });
});

export { router as authRouter };
