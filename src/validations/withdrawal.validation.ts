import Joi from "joi";

export const withdrawalRequestSchema = Joi.object({
    amount: Joi.number().min(2000).max(100000).required(),
    paymentMethodId: Joi.string().uuid().required(),
});


export const adminWithdrawalUpdateSchema = Joi.object({
    status: Joi.string().valid("approved", "rejected", "paid").required(),
    adminNote: Joi.string().optional().allow(""),
});
