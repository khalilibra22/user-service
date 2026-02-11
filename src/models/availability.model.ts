import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from "typeorm";
import { UserModel } from "./user.model";
import { DayOfWeek } from "../enums/day-of-week.enum";

@Entity("availabilities")
@Index("IDX_availabilities_user_id", ["user"])
@Index("IDX_availabilities_day_of_week", ["dayOfWeek"])
@Index("IDX_availabilities_is_available", ["isAvailable"])
@Index("IDX_availabilities_is_active", ["isActive"])
@Index("IDX_availabilities_user_active", ["user", "isActive"])
@Index("IDX_availabilities_user_available", ["user", "isAvailable"])
export class AvailabilityModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({
    type: "enum",
    enum: DayOfWeek,
  })
  dayOfWeek?: DayOfWeek;

  @Column({ type: "time" })
  startTime?: string;

  @Column({ type: "time" })
  endTime?: string;

  @Column({ name: "is_availabale", type: "boolean", default: true })
  isAvailable?: boolean;

  @Column({ name: "is_free", type: "boolean", default: false })
  isFree?: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive?: boolean;

  @ManyToOne(() => UserModel, (user) => user.availabilities)
  //@JoinColumn({ name: "teacherId" })
  user?: UserModel;

  @Column({ name: "reserved_until", type: "timestamp", nullable: true })
  reservedUntil?: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
