import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { PlanModel } from "./plan.model";
import { UserModel } from "./user.model";

@Entity("subscriptions")
@Index("IDX_subscriptions_status", ["status"])
@Index("IDX_subscriptions_start_date", ["startDate"])
@Index("IDX_subscriptions_end_date", ["endDate"])
@Index("IDX_subscriptions_created_at", ["createdAt"])
@Index("IDX_subscriptions_status_end_date", ["status", "endDate"])
@Index("IDX_subscriptions_user_status", ["user", "status"])
export class SubscriptionModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ name: "start_date", type: "timestamp", nullable: true })
  startDate?: Date;

  @Column({ name: "end_date", type: "timestamp", nullable: true })
  endDate?: Date;

  @Column({ default: "pending_payment" })
  status?: string; // 'pending_payment' | 'active' | 'inactive' | 'cancelled'

  /**
   * If set, the subscription will switch to this plan at endDate.
   * Used for downgrades (take effect at end of billing period).
   */
  @Column({ name: "scheduled_plan_id", nullable: true, type: "int" })
  scheduledPlanId?: number | null;

  /**
   * Tracks the reason for the next renewal cycle:
   * 'renew' | 'upgrade' | 'downgrade' | null
   */
  @Column({ name: "renewal_status", nullable: true, type: "varchar" })
  renewalStatus?: string | null;

  @ManyToOne(() => PlanModel, (plan) => plan.subscriptions)
  plan?: PlanModel;

  @ManyToOne(() => UserModel, (user) => user.subscriptions)
  user?: UserModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
