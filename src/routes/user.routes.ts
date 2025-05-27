import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  addTopicToUserValidationSchema,
  checkPermissionsValidationSchema,
  createUserValidationSchema,
  paymentMethodValidationSchema,
  updateUserPhoneNumberValidationSchema,
  updateUserValidationSchema,
} from "../validations/user.validation";
import { UserController } from "../controllers/user.controller";
import { AuthMiddleware } from "../utils/auth.middleware";

const router = express.Router();

const userController = new UserController();

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

export { router as userRouter };
