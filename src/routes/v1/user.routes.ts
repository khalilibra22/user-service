import express from "express";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { UserController } from "../../controllers/user.controller";
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
  nearbyUsersQueryValidationSchema,
} from "../../validations/user.validation";

const userController = new UserController();

const router = express.Router();
router.use("/:id/topics", topicRouter);
router.use("/:id/payment-methods", paymentMethodRouter);
router.use("/:id/academic-backgrounds", academicBackgroundRouter);
router.use("/:id/availabilities", availabilityRouter);
router.use("/:id/availability-exceptions", availabilityExceptionRouter);
router.use("/:id/coupons", couponRouter);

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(updateUserValidationSchema),
  userController.updateUser
);

router.get(
  "/:id/details",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "read"),
  userController.getUserById
);

// Get user plan
router.get(
  "/:id/plans",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "view"),
  userController.getUserPlan
);

// Get all teahers
router.get(
  "/teachers",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "list"),
  userController.getAllTeachers
);

router.get(
  "/students",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "list"),
  userController.getAllStudents
);

router.get(
  "/academies",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "list"),
  userController.getAllAcademies
);

router.get(
  "/admins",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "overview"),
  userController.getAllAdmins
);

//create user
router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "invite"),
  ValidationMiddleware.validate(createUserValidationSchema),
  userController.createUser
);

//update user's phone number
router.patch(
  "/:id/phone-number",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(updateUserPhoneNumberValidationSchema),
  userController.updateUserPhoneNumber
);

// delete user
router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "delete"),
  userController.deleteUser
);

// update user password
router.patch(
  "/:id/password",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(changePasswordSchema),
  userController.updateUserPassword
);

// update user email
router.patch(
  "/:id/email",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(changeEmailSchema),
  userController.updateUserEmail
);

// update user's contact information
router.patch(
  "/:id/contact-info",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(contactInfoValidationSchema),
  userController.updateUserContactInfo
);

// Get user's contact information
router.get(
  "/:id/contact-info",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "read"),
  userController.getUserContactInfo
);

router.get("/:id/minimal", userController.getUserMinimalInfo);

router.get(
  "/:id/switch-role",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "update"),
  userController.switchUserRole
);

// Update user's GPS location
router.patch(
  "/:id/location",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("users", "update"),
  ValidationMiddleware.validate(updateUserLocationValidationSchema),
  userController.updateUserLocation
);

// Get nearby teachers and academies
router.get(
  "/nearby",
  //AuthMiddleware.verifyToken,
  ValidationMiddleware.validateQuery(nearbyUsersQueryValidationSchema),
  userController.getNearbyTeachers
);

export { router as userRouter };
