import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PlanModel } from "./plan.model";
import { UserModel } from "./user.model";

@Entity("subscriptions")
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
