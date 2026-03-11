import { Expose } from "class-transformer";
import { TransactionStatus } from "../enums/transaction-status.enum";
import { PaymentMethod } from "../enums/payment-method.enum";
import { PaymentProvider } from "../enums/payment-provider.enum";

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
