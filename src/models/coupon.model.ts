import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { UserModel } from "./user.model";

@Entity("coupons")
@Index("IDX_coupons_code", ["code"])
@Index("IDX_coupons_user_id", ["user"])
@Index("IDX_coupons_type", ["type"])
@Index("IDX_coupons_is_active", ["isActive"])
@Index("IDX_coupons_start_date", ["startDate"])
@Index("IDX_coupons_expiry_date", ["expiryDate"])
@Index("IDX_coupons_code_active", ["code", "isActive"])
@Index("IDX_coupons_user_active", ["user", "isActive"])
@Index("IDX_coupons_dates_active", ["startDate", "expiryDate", "isActive"])
export class CouponModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  code?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({
    type: "enum",
    enum: ["percentage", "amount"],
    default: "percentage",
  })
  type?: "percentage" | "amount";

  @Column("decimal", { precision: 15, scale: 2, nullable: true })
  discountValue?: number;

  @Column({
    type: "enum",
    enum: ["group", "live", "prerecorded", "one-on-one", "all"],
    default: "all",
  })
  applicableResource?: "group" | "live" | "prerecorded" | "one-on-one" | "all";

  @Column("simple-array", { nullable: true })
  resourceIds?: number[];

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
