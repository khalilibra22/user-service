import Joi from "joi";
import { PaymentMethod } from "../enums/payment-method.enum";
import { TransactionStatus } from "../enums/transaction-status.enum";

export const initiatePaymentSchema = Joi.object({
    userId: Joi.string().uuid().when("referenceType", {
        is: "WALLET_TOPUP",
        then: Joi.forbidden(),
        otherwise: Joi.optional(),
    }),
    amount: Joi.number().positive().precision(2).required(),
    method: Joi.string().when("referenceType", {
        is: "WALLET_TOPUP",
        then: Joi.valid(PaymentMethod.SATIM).required(),
        otherwise: Joi.valid(...Object.values(PaymentMethod)).required(),
    }),
    referenceType: Joi.string().valid("SUBSCRIPTION", "COURSE_ENROLLMENT", "ONE_ON_ONE_ENROLLMENT", "WALLET_TOPUP").required(),
    referenceId: Joi.string().when("referenceType", {
        is: "WALLET_TOPUP",
        then: Joi.optional().allow(null, ""),
        otherwise: Joi.required(),
    }),
    description: Joi.string().required(),
    metadata: Joi.any().optional(),
    couponCode: Joi.any().when("referenceType", {
        is: "WALLET_TOPUP",
        then: Joi.forbidden(),
        otherwise: Joi.string().optional().allow(null, ""),
    }),
});

export const submitReceiptSchema = Joi.object({
    receiptUrl: Joi.string().required(),
});

export const validateTransactionSchema = Joi.object({
    status: Joi.string().valid(TransactionStatus.SUCCESS, TransactionStatus.FAILED).required(),
    adminNote: Joi.string().optional().allow(null, ""),
});
