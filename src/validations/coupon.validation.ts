import Joi from "joi";

export const couponValidationSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  type: Joi.string().valid("percentage", "amount").required(),
  discountValue: Joi.number().required(),
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
});
