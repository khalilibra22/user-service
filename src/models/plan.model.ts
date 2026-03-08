import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { UserModel } from "./user.model";
import { SubscriptionModel } from "./subscription.model";

@Entity("plans")
@Index("IDX_plans_type", ["type"])
@Index("IDX_plans_is_active", ["isActive"])
@Index("IDX_plans_price", ["price"])
@Index("IDX_plans_type_active", ["type", "isActive"])
export class PlanModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price?: number;

  @Column()
  type?: string; // 'free' | 'pro' | 'premium'

  @Column({ name: "is_active", default: true })
  isActive?: boolean;

  @Column()
  duration?: number;

  @Column({ name: "duration_unit", default: "months" })
  durationUnit?: string; // 'months' | 'years'

  @Column({ name: "group_course_count", nullable: true })
  groupCourseCount?: number;

  @Column({ name: "live_course_count", nullable: true })
  liveCourseCount?: number;

  @Column({ name: "one_on_one_fee_percentage", type: "decimal", precision: 5, scale: 2, default: 8 })
  oneOnOneFeePercentage?: number;

  @Column({ name: "prerecorded_fee_percentage", type: "decimal", precision: 5, scale: 2, default: 8 })
  prerecordedFeePercentage?: number;

  @Column({ name: "has_pro_badge", default: false })
  hasProBadge?: boolean;

  @Column({ name: "is_listed_in_distinguished", default: false })
  isListedInDistinguished?: boolean;

  @Column({ name: "has_search_priority", default: false })
  hasSearchPriority?: boolean;

  @Column({ name: "has_page_customization", default: false })
  hasPageCustomization?: boolean;

  @OneToMany(() => UserModel, (user) => user.plan)
  users?: UserModel[];

  @OneToMany(() => SubscriptionModel, (subscription) => subscription.plan)
  subscriptions?: SubscriptionModel[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
