import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { UserModel } from "./user.model";

export enum WalletTransactionType {
    CREDIT = "credit",
    DEBIT = "debit",
}

export enum WalletTransactionPurpose {
    REFUND = "refund",
    PURCHASE = "purchase",
    WITHDRAWAL = "withdrawal",
    EARNING_RELEASE = "earning_release",
    TOPUP = "topup",
}

@Entity("wallet_transactions")
export class WalletTransactionModel {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => UserModel)
    @Index()
    user!: UserModel;

    @Column({ name: "user_id" })
    userId!: string;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    amount!: number;

    @Column({
        type: "enum",
        enum: WalletTransactionType,
    })
    type!: WalletTransactionType;

    @Column({
        type: "enum",
        enum: WalletTransactionPurpose,
    })
    purpose!: WalletTransactionPurpose;

    @Column({ type: "json", nullable: true })
    metadata?: any;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
