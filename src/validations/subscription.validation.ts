import Joi from "joi";

export const planSValdationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).required(),
  price: Joi.number().min(0).precision(2).required(), // min 0 to allow free plans
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

export const updatePlanValidationSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().min(10),
  price: Joi.number().min(0).precision(2),
  type: Joi.string().valid("free", "pro", "premium"),
  duration: Joi.number().integer().min(1),
  durationUnit: Joi.string().valid("days", "weeks", "months", "years"),
  oneOnOneCourseCount: Joi.number().integer().min(0),
  groupCourseCount: Joi.number().integer().min(0),
  liveCourseCount: Joi.number().integer().min(0),
  prerecordedCourseCount: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
}).min(1); // At least one field required

export const userSubscriptionValidationSchema = Joi.object({
  paymentMethod: Joi.string()
    .valid("satim", "baridimob", "ccp_transfer", "wallet")
    .optional(),
  couponCode: Joi.string().max(50).optional(),
});
