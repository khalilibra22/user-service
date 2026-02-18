import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { UserModel } from "./user.model";

@Entity("user_wallets")
export class UserWalletModel {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @OneToOne(() => UserModel)
    @JoinColumn({ name: "user_id" })
    user!: UserModel;

    @Column({ name: "user_id" })
    userId!: string;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0, name: "total_earned" })
    totalEarned!: number; // Only relevant for teachers, but kept for simplicity in a unified model

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0, name: "current_balance" })
    currentBalance!: number; // Spendable/Withdrawable balance

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0, name: "frozen_balance" })
    frozenBalance!: number; // Only relevant for teachers (release period)

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
