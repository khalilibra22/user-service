import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { UserModel } from "./user.model";
import { DayOfWeek } from "../enums/dayOfWeek.enum";

@Entity("availabilities")
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

  @ManyToOne(() => UserModel, (user) => user.availabilities)
  //@JoinColumn({ name: "teacherId" })
  user?: UserModel;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
