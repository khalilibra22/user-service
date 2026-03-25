import express from "express";
import { container } from "../../container";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { UserProfileController } from "../../controllers/user-profile.controller";
import { UserAdminController } from "../../controllers/user-admin.controller";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { topicRouter } from "./topic.routes";
import { paymentMethodRouter } from "./payment-method.routes";
import { academicBackgroundRouter } from "./academic-background.routes";
import { availabilityRouter } from "./availability.routes";
import { availabilityExceptionRouter } from "./availability-exception.routes";
import { couponRouter } from "./coupon.routes";
import {
  changeEmailSchema,
  changePasswordSchema,
  contactInfoValidationSchema,
  createUserValidationSchema,
  updateUserPhoneNumberValidationSchema,
  updateUserValidationSchema,
  updateUserLocationValidationSchema,
} from "../../validations/user.validation";

const profileCtrl = container.resolve(UserProfileController);
const adminCtrl = container.resolve(UserAdminController);

const router = express.Router();
router.use("/:id/topics", topicRouter);
router.use("/:id/payment-methods", paymentMethodRouter);
router.use("/:id/academic-backgrounds", academicBackgroundRouter);
router.use("/:id/availabilities", availabilityRouter);
router.use("/:id/availability-exceptions", availabilityExceptionRouter);
router.use("/:id/coupons", couponRouter);

// ── Profile routes (self-service) ────────────────────────────────────────────
router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(updateUserValidationSchema),
  profileCtrl.updateUser
);

router.get(
  "/:id/details",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelfOrAdmin,
  AuthMiddleware.authorize("users", "read"),
  profileCtrl.getUserById
);

router.get(
  "/:id/plans",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelfOrAdmin,
  AuthMiddleware.authorize("subscriptions", "view"),
  profileCtrl.getUserPlan
);

router.patch(
  "/:id/phone-number",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(updateUserPhoneNumberValidationSchema),
  profileCtrl.updateUserPhoneNumber
);

router.patch(
  "/:id/password",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(changePasswordSchema),
  profileCtrl.updateUserPassword
);

router.patch(
  "/:id/email",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(changeEmailSchema),
  profileCtrl.updateUserEmail
);

router.patch(
  "/:id/contact-info",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(contactInfoValidationSchema),
  profileCtrl.updateUserContactInfo
);

router.get(
  "/:id/contact-info",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelfOrAdmin,
  AuthMiddleware.authorize("users", "read"),
  profileCtrl.getUserContactInfo
);

router.get("/:id/minimal", profileCtrl.getUserMinimalInfo);

router.get(
  "/:id/switch-role",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelfOrAdmin,
  AuthMiddleware.authorize("users", "update"),
  profileCtrl.switchUserRole
);

router.patch(
  "/:id/location",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(updateUserLocationValidationSchema),
  profileCtrl.updateUserLocation
);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get(
  "/teachers",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "list"),
  adminCtrl.getAllTeachers
);

router.get(
  "/students",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "list"),
  adminCtrl.getAllStudents
);

router.get(
  "/academies",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "list"),
  adminCtrl.getAllAcademies
);

router.get(
  "/admins",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "overview"),
  adminCtrl.getAllAdmins
);

router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "invite"),
  ValidationMiddleware.validate(createUserValidationSchema),
  adminCtrl.createUser
);

router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelfOrAdmin,
  AuthMiddleware.authorize("users", "delete"),
  adminCtrl.deleteUser
);

export { router as userRouter };
