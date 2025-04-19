import Joi from "joi";

export const planSValdationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).required(),
  price: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid("free", "pro", "premium").required(),
  duration: Joi.number().integer().min(1).required(),
  durationUnit: Joi.string()
    .valid("days", "weeks", "months", "years")
    .required(),
  oneOnOneCourseCount: Joi.number().integer().min(0).required(),
  groupCourseCount: Joi.number().integer().min(0).required(),
  liveCourseCount: Joi.number().integer().min(0).required(),
  prerecordedCourseCount: Joi.number().integer().min(0).required(),
});

export const userSubscriptionValidationSchema = Joi.object({
  userId: Joi.string().uuid({ version: "uuidv4" }).required(),
});
