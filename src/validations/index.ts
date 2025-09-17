import Joi from "joi";
import { TeachingMode } from "../enums/teaching-modes.enum";
import { UserRole } from "../enums/userRoles.enum";

export const teachingModesValidation = Joi.when("role", {
  is: Joi.valid(UserRole.SUPERVISOR, UserRole.STUDENT),
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
          message: "Academies cannot use teaching modes: HOME or STUDENT_HOME.",
        });
      }
      if (role === UserRole.TEACHER && value.includes(TeachingMode.ACADEMY)) {
        return helpers.error("any.invalid", {
          message: "Teachers cannot use ACADEMY teaching mode.",
        });
      }

      return value;
    }),
});

export const passwordValidation = Joi.string()
  .min(6)
  .pattern(
    new RegExp(
      "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@\\-_!#$%^&*()+={}\\[\\]:;\"'<>,.?/~`|\\\\]+$"
    )
  ) // At least one letter & one number, special characters allowed
  .required()
  .messages({
    "string.pattern.base":
      "Password must be at least 6 characters long and contain at least one letter and one number.",
  });

export const phoneNumberValidation = Joi.string()
  .pattern(/^0[5-7]\d{8}$/)
  .optional()
  .messages({
    "string.pattern.base":
      "Phone number must be a valid Algerian mobile number starting with 05, 06, or 07 followed by 8 digits",
  });
