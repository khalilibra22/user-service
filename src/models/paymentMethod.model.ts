import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserModel } from "./user.model";

@Entity("payment_methods")
export class PaymentMethodModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column()
  type?: string; // e.g., "bank", "credit_card", etc.

  @Column({ nullable: true, name: "bank_name" })
  bankName?: string;

  @Column({ name: "account_number" })
  accountNumber?: string;

  @Column({ nullable: true, name: "swift_code_key" })
  swiftCodeOrCcpKey?: string; // e.g., "SWIFT" for bank or "CCP" for postal bank

  @Column({ nullable: true, name: "bank_address" })
  bankAddress?: string;

  @Column({ nullable: true, name: "account_holder_name" })
  accountHolderName?: string;

  @Column({ default: true, name: "is_actived" })
  isActived!: boolean;

  @ManyToOne(() => UserModel, (user) => user.academicBackgrounds)
  user?: UserModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
