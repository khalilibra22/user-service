import express from "express";
import { AuthController } from "../../controllers/auth.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import {
  changeEmailSchema,
  loginValidationSchema,
  resetPasswordSchema,
  userValidationSchema,
} from "../../validations/user.validation";
import { upload } from "../../config/multer";
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
  authController.register
);
router.post(
  "/login",
  ValidationMiddleware.validate(loginValidationSchema),
  authController.login
);

router.post(
  "/forgot-password",
  ValidationMiddleware.validate(changeEmailSchema),
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
