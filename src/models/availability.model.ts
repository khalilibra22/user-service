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

  @ManyToOne(() => UserModel, (user) => user.availabilities)
  @JoinColumn({ name: "teacherId" })
  teacher?: UserModel;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
// @Column({ type: "date", nullable: true })
// exceptionDate?: Date;

// @Column({ type: "time", nullable: true })
// exceptionStartTime?: string;

// @Column({ type: "time", nullable: true })
// exceptionEndTime?: string;

// @Column({ type: "boolean", default: false })
// isException?: boolean;
