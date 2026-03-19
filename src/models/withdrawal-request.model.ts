import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    JoinColumn,
} from "typeorm";
import { UserModel } from "./user.model";
import { WithdrawalStatus } from "../enums/withdrawal-status.enum";
import { PaymentMethodModel } from "./payment-method.model";

@Entity("withdrawals")
@Index("IDX_withdrawals_status", ["status"])
@Index("IDX_withdrawals_teacher", ["teacher"])
export class WithdrawalModel {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: "teacher_id" })
    teacher!: UserModel;

    @Column({ name: "teacher_id" })
    teacherId!: string;

    @ManyToOne(() => PaymentMethodModel)
    @JoinColumn({ name: "payment_method_id" })
    paymentMethod!: PaymentMethodModel;

    @Column({ name: "payment_method_id" })
    paymentMethodId!: string;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    amount!: number;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    fee!: number;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0, name: "net_amount" })
    netAmount!: number;


    @Column({
        type: "enum",
        enum: WithdrawalStatus,
        default: WithdrawalStatus.PENDING,
    })
    status!: WithdrawalStatus;

    @Column({ name: "admin_note", nullable: true })
    adminNote?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}

