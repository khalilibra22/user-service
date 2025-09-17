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

  @Column({ name: "one_on_one_course_count", nullable: true })
  oneOnOneCourseCount?: number;

  @Column({ name: "group_course_count", nullable: true })
  groupCourseCount?: number;

  @Column({ name: "live_course_count", nullable: true })
  liveCourseCount?: number;

  @Column({ name: "prerecorded_course_count", nullable: true })
  prerecordedCourseCount?: number;

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
