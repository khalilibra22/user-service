import Joi from "joi";
import { PaymentMethod } from "../enums/payment-method.enum";
import { TransactionStatus } from "../enums/transaction-status.enum";

export const initiatePaymentSchema = Joi.object({
    userId: Joi.string().uuid().optional(),
    amount: Joi.number().positive().precision(2).required(),
    method: Joi.string().valid(...Object.values(PaymentMethod)).required(),
    referenceType: Joi.string().valid("SUBSCRIPTION", "COURSE_ENROLLMENT", "ONE_ON_ONE_ENROLLMENT").required(),
    referenceId: Joi.string().required(),
    description: Joi.string().required(),
    metadata: Joi.any().optional(),
    couponCode: Joi.string().optional().allow(null, ""),
});

export const submitReceiptSchema = Joi.object({
    receiptUrl: Joi.string().required(),
});

export const validateTransactionSchema = Joi.object({
    status: Joi.string().valid(TransactionStatus.SUCCESS, TransactionStatus.FAILED).required(),
    adminNote: Joi.string().optional().allow(null, ""),
});
