import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  addTopicToUserValidationSchema,
  changeEmailSchema,
  changePasswordSchema,
  checkPermissionsValidationSchema,
  contactInfoValidationSchema,
  createUserValidationSchema,
  paymentMethodValidationSchema,
  updateUserPhoneNumberValidationSchema,
  updateUserValidationSchema,
} from "../validations/user.validation";
import { UserController } from "../controllers/user.controller";
import { AuthMiddleware } from "../utils/auth.middleware";
import { AcademicBackgroundController } from "../controllers/academicBackground.controller";
import {
  academicBackgroundSchema,
  updateAcademicBackgroundSchema,
} from "../validations/academicBackground.validation";
import { AvailabilityController } from "../controllers/availability.controller";
import {
  availabilityExceptionSchema,
  availabilitySchema,
} from "../validations/availability.validation";

const router = express.Router();

const userController = new UserController();
const academicBackgroundController = new AcademicBackgroundController();
const availabilityController = new AvailabilityController();

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(updateUserValidationSchema),
  async (req, res) => await userController.updateUser(req, res)
);

router.get(
  "/:id/details",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.getUserById(req, res)
);

router.post(
  "/:id/check-permissions",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(checkPermissionsValidationSchema),
  async (req, res) => await userController.checkPermissions(req, res)
);

router.post(
  "/:id/topics",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(addTopicToUserValidationSchema),
  async (req, res) => await userController.addTopicToUser(req, res)
);

// Get topics by user id
router.get(
  "/:id/topics",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.getTopicsByUserId(req, res)
);

// Get user plan
router.get(
  "/:id/plans",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.getUserPlan(req, res)
);

//Add payment method to user
router.post(
  "/:id/payment-methods",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(paymentMethodValidationSchema),
  async (req, res) => await userController.addPaymentMethod(req, res)
);

// Update payment method
router.put(
  "/:id/payment-methods/:paymentMethodId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(paymentMethodValidationSchema),
  async (req, res) => await userController.updatePaymentMethod(req, res)
);

// Get payment methods by user id
router.get(
  "/:id/payment-methods",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.getPaymentMethodsByUserId(req, res)
);

// Delete payment method
router.delete(
  "/:id/payment-methods/:paymentMethodId",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.deletePaymentMethod(req, res)
);

// Get all teahers
router.get(
  "/teachers",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.getAllTeachers(req, res)
);

router.get(
  "/students",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.getAllStudents(req, res)
);

router.get(
  "/academies",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.getAllAcademies(req, res)
);

router.get(
  "/admins",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.getAllAdmins(req, res)
);

//create user
router.post(
  "/",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(createUserValidationSchema),
  async (req, res) => await userController.createUser(req, res)
);

//update user's phone number
router.patch(
  "/:id/phone-number",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(updateUserPhoneNumberValidationSchema),
  async (req, res) => await userController.updateUserPhoneNumber(req, res)
);

// delete user
router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.deleteUser(req, res)
);

// update user password
router.patch(
  "/:id/password",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(changePasswordSchema),
  async (req, res) => await userController.updateUserPassword(req, res)
);

// update user email
router.patch(
  "/:id/email",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(changeEmailSchema),
  async (req, res) => await userController.updateUserEmail(req, res)
);

// update user's contact information
router.patch(
  "/:id/contact-info",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(contactInfoValidationSchema),
  async (req, res) => await userController.updateUserContactInfo(req, res)
);

// Get user's contact information
router.get(
  "/:id/contact-info",
  AuthMiddleware.verifyToken,
  async (req, res) => await userController.getUserContactInfo(req, res)
);

// Create user's academic background
router.post(
  "/:id/academic-backgrounds",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(academicBackgroundSchema),
  async (req, res) =>
    await academicBackgroundController.createAcademicBackground(req, res)
);

// Update user's academic background
router.put(
  "/:id/academic-backgrounds/:academicBackgroundId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(updateAcademicBackgroundSchema),
  async (req, res) =>
    await academicBackgroundController.updateAcademicBackground(req, res)
);

// Delete user's academic background
router.delete(
  "/:id/academic-backgrounds/:academicBackgroundId",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await academicBackgroundController.deleteAcademicBackground(req, res)
);

// Get user's academic background by user ID
router.get(
  "/:id/academic-backgrounds",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await academicBackgroundController.getAcademicBackgroundByUserId(req, res)
);

// create availability
router.post(
  "/:id/availabilities",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(availabilitySchema),
  async (req, res) => await availabilityController.createAvailability(req, res)
);

// update availability
router.put(
  "/:id/availabilities/:availabilityId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(availabilitySchema),
  async (req, res) => await availabilityController.updateAvailability(req, res)
);

// delete availability
router.delete(
  "/:id/availabilities/:availabilityId",
  AuthMiddleware.verifyToken,
  async (req, res) => await availabilityController.deleteAvailability(req, res)
);

// get user's availability by user ID
router.get(
  "/:id/availabilities",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await availabilityController.getTeacherAvailability(req, res)
);

router.post(
  "/:id/availability-exceptions",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(availabilityExceptionSchema),
  async (req, res) =>
    await availabilityController.createAvailabilityException(req, res)
);

// update availability exception
router.put(
  "/:id/availability-exceptions/:exceptionId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(availabilityExceptionSchema),
  async (req, res) =>
    await availabilityController.updateAvailabilityException(req, res)
);

// delete availability exception
router.delete(
  "/:id/availability-exceptions/:exceptionId",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await availabilityController.deleteAvailabilityException(req, res)
);

// get user's availability exceptions by user ID
router.get(
  "/:id/availability-exceptions",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await availabilityController.getTeacherAvailabilityExceptions(req, res)
);

export { router as userRouter };
