import Joi from "joi";

export const withdrawalRequestSchema = Joi.object({
    amount: Joi.number().positive().required(),
});

export const adminWithdrawalUpdateSchema = Joi.object({
    status: Joi.string().valid("approved", "rejected", "paid").required(),
    adminNote: Joi.string().optional().allow(""),
});
