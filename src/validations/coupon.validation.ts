import Joi from "joi";

export const couponValidationSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  type: Joi.string().valid("percentage", "amount").required(),
  discountValue: Joi.number().positive().required(),
  maxDiscountAmount: Joi.number().positive().optional().allow(null),
  minOrderAmount: Joi.number().positive().optional().allow(null),
  usageLimit: Joi.number().integer().min(1).required(),
  startDate: Joi.date().required(),
  expiryDate: Joi.date()
    .when("startDate", {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref("startDate")),
      otherwise: Joi.date(),
    })
    .required(),
  isActive: Joi.boolean().required(),
  applicableResource: Joi.string()
    .valid("group", "live", "prerecorded", "one-on-one", "all")
    .required(),
  resourceIds: Joi.array()
    .items(Joi.string())
    .min(1)
    .when("applicableResource", {
      is: "all",
      then: Joi.forbidden(),
      otherwise: Joi.required(),
    })
    .allow(null),
});

export const validateCouponSchema = Joi.object({
  couponCode: Joi.string().required(),
  amount: Joi.number().positive().precision(2).required(),
  resourceType: Joi.string()
    .valid("group", "live", "prerecorded", "one-on-one")
    .optional()
    .allow(null, ""),
  resourceId: Joi.string().optional().allow(null, ""),
});
