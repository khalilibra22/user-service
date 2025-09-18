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

@Entity("availability_exceptions")
@Index("IDX_availability_exceptions_user_id", ["user"])
@Index("IDX_availability_exceptions_exception_date", ["exceptionDate"])
@Index("IDX_availability_exceptions_is_available", ["isAvailable"])
@Index("IDX_availability_exceptions_user_date", ["user", "exceptionDate"])
export class AvailabilityExceptionModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @ManyToOne(() => UserModel, (user) => user.availabilityExceptions)
  //@JoinColumn({ name: "teacherId" })
  user?: UserModel;

  @Column({ type: "timestamp" })
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
