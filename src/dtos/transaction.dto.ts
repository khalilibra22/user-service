import { Expose, Transform } from "class-transformer";
import { TransactionStatus } from "../enums/transaction-status.enum";
import { PaymentMethod } from "../enums/payment-method.enum";
import { PaymentProvider } from "../enums/payment-provider.enum";
import { getS3Url } from "../utils";

export class TransactionDto {
    @Expose()
    id!: string;

    @Expose()
    amount!: number;

    @Expose()
    currency!: string;

    @Expose()
    status!: TransactionStatus;

    @Expose()
    method!: PaymentMethod;

    @Expose()
    provider!: PaymentProvider;

    @Expose()
    @Transform(({ value }) => (value ? getS3Url(value) : undefined))
    receiptUrl?: string;

    @Expose()
    referenceType!: string;

    @Expose()
    referenceId!: string;

    @Expose()
    description?: string;

    @Expose()
    metadata?: any;

    @Expose()
    createdAt!: Date;
}
