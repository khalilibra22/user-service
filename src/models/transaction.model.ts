import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { UserModel } from "./user.model";
import { TransactionStatus } from "../enums/transaction-status.enum";
import { PaymentMethod } from "../enums/payment-method.enum";
import { PaymentProvider } from "../enums/payment-provider.enum";

@Entity("transactions")
@Index("IDX_transactions_status", ["status"])
@Index("IDX_transactions_user", ["user"])
@Index("IDX_transactions_external_id", ["externalId"])
export class TransactionModel {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount!: number;

    @Column({ default: "DZD" })
    currency!: string;

    @Column({
        type: "enum",
        enum: TransactionStatus,
        default: TransactionStatus.PENDING,
    })
    status!: TransactionStatus;

    @Column({
        type: "enum",
        enum: PaymentMethod,
    })
    method!: PaymentMethod;

    @Column({
        type: "enum",
        enum: PaymentProvider,
        default: PaymentProvider.MANUAL,
    })
    provider!: PaymentProvider;

    @Column({ name: "external_id", nullable: true })
    externalId?: string; // SATIM Order ID or similar

    @Column({ name: "receipt_url", nullable: true })
    receiptUrl?: string; // For manual payments

    @Column({ name: "admin_note", nullable: true })
    adminNote?: string;

    @Column({ name: "reference_type" })
    referenceType!: string; // 'SUBSCRIPTION' | 'COURSE' | 'ONE_ON_ONE'

    @Column({ name: "reference_id" })
    referenceId!: string; // ID of the related entity

    @ManyToOne(() => UserModel, (user) => user.transactions)
    user!: UserModel;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
