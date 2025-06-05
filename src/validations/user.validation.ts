import Joi from "joi";
import { UserRole } from "../enums/userRoles.enum";
import {
  passwordValidation,
  phoneNumberValidation,
  teachingModesValidation,
} from ".";

export const userValidationSchema = Joi.object({
  fullname: Joi.string().required(),
  email: Joi.string().email().required(),
  phoneNumber: phoneNumberValidation,
  password: passwordValidation,
  role: Joi.number()
    .valid(...Object.values(UserRole))
    .required(),

  // Fields forbidden for Admins (0) and Students (2)
  state: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  district: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  city: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  zipcode: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  address: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  teachingModes: teachingModesValidation,
  bio: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  profilePicture: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.object().optional(),
  }),
  certificate: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.object().optional(),
  }),
});

export const updateUserValidationSchema = Joi.object({
  fullname: Joi.string().required(),
  phoneNumber: phoneNumberValidation,
  role: Joi.number()
    .valid(...Object.values(UserRole))
    .required(),
  state: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  district: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  city: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  zipcode: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  address: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  address2: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().optional(),
  }),
  timeSlot: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.number().required(),
  }),
  pushNotifications: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.boolean().required(),
  }),
  gender: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT, UserRole.ACADEMY),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  language: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().optional(),
  }),
  bio: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  // Teaching Modes Validation
  teachingModes: teachingModesValidation,
});

export const loginValidationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const changeEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordValidation,
});

export const resetPasswordSchema = Joi.object({
  password: passwordValidation,
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordValidation,
});

export const checkPermissionsValidationSchema = Joi.object({
  permission: Joi.number().integer().positive().required(),
});

export const addTopicToUserValidationSchema = Joi.object({
  topicId: Joi.number().integer().positive().required(),
  price: Joi.number().positive().required(),
});

const bankSchema = Joi.object({
  type: Joi.string().valid("bank").required(),
  bankName: Joi.string().required(),
  accountNumber: Joi.string().required(),
  swiftCodeOrCcpKey: Joi.string().required(),
  bankAddress: Joi.string().required(),
  accountHolderName: Joi.string().required(),
});

const ccpSchema = Joi.object({
  type: Joi.string().valid("ccp").required(),
  accountNumber: Joi.string().required(),
  swiftCodeOrCcpKey: Joi.string().required(),
  accountHolderName: Joi.string().required(),
});

const baridimobSchema = Joi.object({
  type: Joi.string().valid("baridimob").required(),
  accountNumber: Joi.string().required(),
});

export const paymentMethodValidationSchema = Joi.alternatives().try(
  bankSchema,
  ccpSchema,
  baridimobSchema
);

export const createUserValidationSchema = Joi.object({
  fullname: Joi.string().required(),
  email: Joi.string().email().required(),
  password: passwordValidation,
  phoneNumber: phoneNumberValidation,
  address: Joi.string().required(),
  isActive: Joi.boolean().required(),
  isApproved: Joi.boolean().required(),
  role: Joi.number()
    .valid(...Object.values(UserRole))
    .required(),
  state: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  city: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  zipcode: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  address2: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().optional(),
  }),
  teachingModes: teachingModesValidation,
  bio: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  gender: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  language: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().optional(),
  }),
});

export const updateUserPhoneNumberValidationSchema = Joi.object({
  phoneNumber: phoneNumberValidation,
});

export const contactInfoValidationSchema = Joi.object({
  contactEmail: Joi.string().email().required(),
  contactPhoneNumber: phoneNumberValidation,
  secondaryContactPhoneNumber: phoneNumberValidation,
  whatsappNumber: phoneNumberValidation,
  website: Joi.string().uri().optional(),
});
