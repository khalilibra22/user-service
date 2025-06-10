import Joi from "joi";

// Validation for availability body
export const availabilitySchema = Joi.object({
  dayOfWeek: Joi.string()
    .valid(
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday"
    )
    .required(),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Start time must be in HH:MM format",
    }),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "End time must be in HH:MM format",
    }),
  isFree: Joi.boolean().optional(),
  //isRecurring: Joi.boolean().default(false),
});

// Validation for availability exception body
export const availabilityExceptionSchema = Joi.object({
  exceptionDate: Joi.date().required(),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Start time must be in HH:MM format",
    }),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "End time must be in HH:MM format",
    }),
  isAvailable: Joi.boolean().optional(),
});

// Validation for updating availability
export const updateAvailabilitySchema = Joi.object({
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      "string.pattern.base": "Start time must be in HH:MM format",
    }),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      "string.pattern.base": "End time must be in HH:MM format",
    }),
  isRecurring: Joi.boolean().optional(),
});

// Validation for updating availability exception
export const updateAvailabilityExceptionSchema = Joi.object({
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      "string.pattern.base": "Start time must be in HH:MM format",
    }),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      "string.pattern.base": "End time must be in HH:MM format",
    }),
  isUnavailable: Joi.boolean().optional(),
  reason: Joi.string().max(255).optional(),
});
