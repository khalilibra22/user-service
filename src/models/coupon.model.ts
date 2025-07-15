import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
} from "typeorm";
import { UserModel } from "./user.model";

@Entity("coupons")
export class CouponModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ unique: true })
  code?: string;

  @Column()
  description?: string;

  @Column({
    type: "enum",
    enum: ["percentage", "amount"],
    default: "percentage",
  })
  type?: "percentage" | "amount";

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  discountPercentage?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  maxDiscountAmount?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  minOrderAmount?: number;

  @Column({ default: 1 })
  usageLimit?: number;

  @Column({ default: 0 })
  usedCount?: number;

  @Column()
  startDate?: Date;

  @Column()
  expiryDate?: Date;

  @Column({ default: true })
  isActive?: boolean;

  @ManyToOne(() => UserModel, (user) => user.coupons)
  user?: UserModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;
}
