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
  groupCourseCount: Joi.number().integer().min(0).required(),
  liveCourseCount: Joi.number().integer().min(0).required(),
  oneOnOneFeePercentage: Joi.number().min(0).max(100).required(),
  prerecordedFeePercentage: Joi.number().min(0).max(100).required(),
  hasProBadge: Joi.boolean().required(),
  isListedInDistinguished: Joi.boolean().required(),
  hasSearchPriority: Joi.boolean().required(),
  hasPageCustomization: Joi.boolean().required(),
});

export const updatePlanValidationSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().min(10),
  price: Joi.number().min(0).precision(2),
  type: Joi.string().valid("free", "pro", "premium"),
  duration: Joi.number().integer().min(1),
  durationUnit: Joi.string().valid("days", "weeks", "months", "years"),
  groupCourseCount: Joi.number().integer().min(0),
  liveCourseCount: Joi.number().integer().min(0),
  oneOnOneFeePercentage: Joi.number().min(0).max(100),
  prerecordedFeePercentage: Joi.number().min(0).max(100),
  hasProBadge: Joi.boolean(),
  isListedInDistinguished: Joi.boolean(),
  hasSearchPriority: Joi.boolean(),
  hasPageCustomization: Joi.boolean(),
  isActive: Joi.boolean(),
}).min(1); // At least one field required

export const userSubscriptionValidationSchema = Joi.object({
  paymentMethod: Joi.string()
    .valid("satim", "baridimob", "ccp_transfer", "wallet")
    .optional(),
  couponCode: Joi.string().max(50).optional(),
});
