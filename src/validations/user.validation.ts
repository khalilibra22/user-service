import Joi from "joi";
import { UserRole } from "../enums/userRoles.enum";
import { TeachingMode } from "../enums/teachingModes.enum";
import e from "express";

export const userValidationSchema = Joi.object({
  fullname: Joi.string().required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().required(),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]+$")) // At least one letter & one number
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 6 characters long and contain at least one letter and one number.",
    }),
  role: Joi.number()
    .valid(...Object.values(UserRole))
    .required(),

  // Fields forbidden for Admins (0) and Students (2)
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
  address: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),

  // Teaching Modes Validation
  teachingModes: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.array()
      .items(Joi.number().valid(...Object.values(TeachingMode))) // Teaching modes must be valid numbers
      .required()
      .custom((value, helpers) => {
        const role = helpers.state.ancestors[0].role; // Get role from input

        if (
          role === UserRole.ACADEMY &&
          (value.includes(TeachingMode.HOME) ||
            value.includes(TeachingMode.STUDENT_HOME))
        ) {
          return helpers.error("any.invalid", {
            message:
              "Academies cannot use teaching modes: HOME or STUDENT_HOME.",
          });
        }
        if (role === UserRole.TEACHER && value.includes(TeachingMode.ACADEMY)) {
          return helpers.error("any.invalid", {
            message: "Teachers cannot use ACADEMY teaching mode.",
          });
        }

        return value;
      }),
  }),

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
  phoneNumber: Joi.string().optional(),
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
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
  language: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.string().required(),
  }),
});

export const loginValidationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(6)
    .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]+$")) // At least one letter & one number
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 6 characters long and contain at least one letter and one number.",
    }),
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
  password: Joi.string()
    .min(6)
    .pattern(new RegExp("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]+$")) // At least one letter & one number
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 6 characters long and contain at least one letter and one number.",
    }),
  phoneNumber: Joi.string().required(),
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
  teachingModes: Joi.when("role", {
    is: Joi.valid(UserRole.ADMIN, UserRole.STUDENT),
    then: Joi.forbidden(),
    otherwise: Joi.array()
      .items(Joi.number().valid(...Object.values(TeachingMode))) // Teaching modes must be valid numbers
      .required()
      .custom((value, helpers) => {
        const role = helpers.state.ancestors[0].role; // Get role from input

        if (
          role === UserRole.ACADEMY &&
          (value.includes(TeachingMode.HOME) ||
            value.includes(TeachingMode.STUDENT_HOME))
        ) {
          return helpers.error("any.invalid", {
            message:
              "Academies cannot use teaching modes: HOME or STUDENT_HOME.",
          });
        }
        if (role === UserRole.TEACHER && value.includes(TeachingMode.ACADEMY)) {
          return helpers.error("any.invalid", {
            message: "Teachers cannot use ACADEMY teaching mode.",
          });
        }

        return value;
      }),
  }),
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
  phoneNumber: Joi.string()
    .pattern(/^0[5-7]\d{8}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be a valid Algerian mobile number starting with 05, 06, or 07 followed by 8 digits",
    }),
});
