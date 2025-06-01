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

@Entity("availability_exceptions")
export class AvailabilityExceptionModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @ManyToOne(() => UserModel, (user) => user.availabilityExceptions)
  @JoinColumn({ name: "teacherId" })
  teacher?: UserModel;

  @Column({ type: "date" })
  exceptionDate?: Date;

  @Column({ type: "time" })
  startTime?: string;

  @Column({ type: "time" })
  endTime?: string;

  @Column({ type: "boolean", default: false })
  isAvailable?: boolean; // true if available, false if unavailable

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
