import Joi from "joi";
import { PaymentMethod } from "../enums/payment-method.enum";
import { TransactionStatus } from "../enums/transaction-status.enum";

export const initiatePaymentSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    amount: Joi.number().positive().precision(2).required(),
    currency: Joi.string().length(3).uppercase().required(),
    method: Joi.string().valid(...Object.values(PaymentMethod)).required(),
    referenceType: Joi.string().valid("SUBSCRIPTION", "COURSE_ENROLLMENT", "ONE_ON_ONE_ENROLLMENT").required(),
    referenceId: Joi.string().required(),
    returnUrl: Joi.string().uri().required(),
    failUrl: Joi.string().uri().required(),
});

export const submitReceiptSchema = Joi.object({
    receiptUrl: Joi.string().required(),
});

export const validateTransactionSchema = Joi.object({
    status: Joi.string().valid(TransactionStatus.SUCCESS, TransactionStatus.FAILED).required(),
    adminNote: Joi.string().optional().allow(null, ""),
});
