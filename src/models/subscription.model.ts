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

  @Column({ name: "start_date", type: "timestamp" })
  startDate?: Date;

  @Column({ name: "end_date", type: "timestamp" })
  endDate?: Date;

  @Column({ default: "active" })
  status?: string; // 'active' | 'inactive' | 'cancelled'

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
