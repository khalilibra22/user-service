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
import { TransactionModel } from "./transaction.model";
import { EarningStatus } from "../enums/earning-status.enum";

@Entity("earnings")
@Index("IDX_earnings_status", ["status"])
@Index("IDX_earnings_teacher", ["teacher"])
@Index("IDX_earnings_release_date", ["releaseDate"])
export class EarningModel {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => UserModel)
    teacher!: UserModel;

    @Column({ name: "teacher_id" })
    teacherId!: string;

    @ManyToOne(() => TransactionModel)
    transaction!: TransactionModel;

    @Column({ name: "transaction_id" })
    transactionId!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount!: number; // Net amount for teacher

    @Column({ type: "decimal", precision: 10, scale: 2, name: "fee_amount" })
    feeAmount!: number; // Platform fee

    @Column({
        type: "enum",
        enum: EarningStatus,
        default: EarningStatus.FROZEN,
    })
    status!: EarningStatus;

    @Column({ type: "timestamp", name: "release_date" })
    releaseDate!: Date;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
