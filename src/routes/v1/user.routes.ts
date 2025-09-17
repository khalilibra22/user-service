import express from "express";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import {
  addTopicToUserValidationSchema,
  changeEmailSchema,
  changePasswordSchema,
  contactInfoValidationSchema,
  createUserValidationSchema,
  paymentMethodValidationSchema,
  updateUserPhoneNumberValidationSchema,
  updateUserValidationSchema,
} from "../../validations/user.validation";
import { UserController } from "../../controllers/user.controller";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { AcademicBackgroundController } from "../../controllers/academic-background.controller";
import {
  academicBackgroundSchema,
  updateAcademicBackgroundSchema,
} from "../../validations/academic-background.validation";
import { AvailabilityController } from "../../controllers/availability.controller";
import {
  availabilityExceptionSchema,
  availabilitySchema,
} from "../../validations/availability.validation";
import { CouponController } from "../../controllers/coupon.controller";
import { couponValidationSchema } from "../../validations/coupon.validation";

const router = express.Router();

const userController = new UserController();
const academicBackgroundController = new AcademicBackgroundController();
const availabilityController = new AvailabilityController();
const couponController = new CouponController();

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

router.post(
  "/:id/topics/:topicId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "pick"),
  ValidationMiddleware.validate(addTopicToUserValidationSchema),
  async (req, res) =>
    academicBackgroundController.addTopicToUser(req, res)
);

// Update topic price for user
router.put(
  "/:id/topics/:topicId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "adjust"),
  ValidationMiddleware.validate(addTopicToUserValidationSchema),
  async (req, res) =>
    academicBackgroundController.updateUserTopicPrice(req, res)
);

// Delete topic from user
router.delete(
  "/:id/topics/:topicId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "drop"),
  async (req, res) =>
    academicBackgroundController.deleteUserTopic(req, res)
);

// Get topics by user id
router.get(
  "/:id/topics",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "view"),
  async (req, res) =>
    academicBackgroundController.getTopicsByUserId(req, res)
);

// Get user plan
router.get(
  "/:id/plans",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("subscriptions", "view"),
  userController.getUserPlan
);

//Add payment method to user
router.post(
  "/:id/payment-methods",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("payment_methods", "create"),
  ValidationMiddleware.validate(paymentMethodValidationSchema),
  userController.addPaymentMethod
);

// Update payment method
router.put(
  "/:id/payment-methods/:paymentMethodId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("payment_methods", "update"),
  ValidationMiddleware.validate(paymentMethodValidationSchema),
  userController.updatePaymentMethod
);

// Get payment methods by user id
router.get(
  "/:id/payment-methods",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("payment_methods", "list"),
  userController.getPaymentMethodsByUserId
);

// Delete payment method
router.delete(
  "/:id/payment-methods/:paymentMethodId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("payment_methods", "delete"),
  userController.deletePaymentMethod
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

// Create user's academic background
router.post(
  "/:id/academic-backgrounds",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("academic_backgrounds", "create"),
  ValidationMiddleware.validate(academicBackgroundSchema),
  async (req, res) =>
    academicBackgroundController.createAcademicBackground(req, res)
);

// Update user's academic background
router.put(
  "/:id/academic-backgrounds/:academicBackgroundId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("academic_backgrounds", "update"),
  ValidationMiddleware.validate(updateAcademicBackgroundSchema),
  async (req, res) =>
    academicBackgroundController.updateAcademicBackground(req, res)
);

// Delete user's academic background
router.delete(
  "/:id/academic-backgrounds/:academicBackgroundId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("academic_backgrounds", "delete"),
  async (req, res) =>
    academicBackgroundController.deleteAcademicBackground(req, res)
);

// Get user's academic background by user ID
router.get(
  "/:id/academic-backgrounds",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("academic_backgrounds", "list"),
  async (req, res) =>
    academicBackgroundController.getAcademicBackgroundByUserId(req, res)
);

// create availability
router.post(
  "/:id/availabilities",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "create"),
  ValidationMiddleware.validate(availabilitySchema),
  availabilityController.createAvailability
);

// update availability
router.put(
  "/:id/availabilities/:availabilityId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "update"),
  ValidationMiddleware.validate(availabilitySchema),
  availabilityController.updateAvailability
);

// delete availability
router.delete(
  "/:id/availabilities/:availabilityId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "delete"),
  availabilityController.deleteAvailability
);

// get user's availability by user ID
router.get(
  "/:id/availabilities",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "list"),
  async (req, res) =>
    availabilityController.getTeacherAvailability(req, res)
);

router.post(
  "/:id/availability-exceptions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "create"),
  ValidationMiddleware.validate(availabilityExceptionSchema),
  async (req, res) =>
    availabilityController.createAvailabilityException(req, res)
);

// update availability exception
router.put(
  "/:id/availability-exceptions/:exceptionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "update"),
  ValidationMiddleware.validate(availabilityExceptionSchema),
  async (req, res) =>
    availabilityController.updateAvailabilityException(req, res)
);

// delete availability exception
router.delete(
  "/:id/availability-exceptions/:exceptionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "delete"),
  async (req, res) =>
    availabilityController.deleteAvailabilityException(req, res)
);

// get user's availability exceptions by user ID
router.get(
  "/:id/availability-exceptions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "list"),
  async (req, res) =>
    availabilityController.getTeacherAvailabilityExceptions(req, res)
);

// Toggle availability status
router.patch(
  "/:id/availabilities/:availabilityId/toggle-status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "toggle"),
  async (req, res) =>
    availabilityController.toggleAvailabilityStatus(req, res)
);

// Deactivate all availabilities for user
router.patch(
  "/:id/availabilities/deactivate-all",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "toggle"),
  async (req, res) =>
    availabilityController.deactivateAllAvailabilities(req, res)
);

// Activate all availabilities for user
router.patch(
  "/:id/availabilities/activate-all",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("availabilities", "toggle"),
  async (req, res) =>
    availabilityController.activateAllAvailabilities(req, res)
);

// Toggle topic status for user
router.patch(
  "/:id/topics/:topicId/toggle-status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("catalogs", "toggle"),
  async (req, res) =>
    academicBackgroundController.toggleUserTopicStatus(req, res)
);

router.post(
  "/:id/coupons",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("coupons", "create"),
  ValidationMiddleware.validate(couponValidationSchema),
  couponController.createCoupon
);

router.put(
  "/:id/coupons/:couponId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("coupons", "update"),
  ValidationMiddleware.validate(couponValidationSchema),
  couponController.updateCoupon
);

router.delete(
  "/:id/coupons/:couponId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("coupons", "delete"),
  couponController.deleteCoupon
);

router.get(
  "/:id/coupons",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("coupons", "list"),
  couponController.getUserCoupons
);

router.get(
  "/:id/minimal",
  userController.getUserMinimalInfo
);

export { router as userRouter };
