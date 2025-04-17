import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserModel } from "./user.model";

@Entity("academic_backgrounds")
export class AcademicBackgroundModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  title?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: "start_date", type: "timestamp", nullable: true })
  startDate?: Date;

  @Column({ name: "end_date", type: "timestamp", nullable: true })
  endDate?: Date;

  @Column({ name: "is_verified", default: false })
  isVerified!: boolean;

  @Column({ nullable: true })
  institution?: string;

  @Column()
  ordering?: number;

  @Column({ nullable: true })
  certificate?: string;

  @ManyToOne(() => UserModel, (user) => user.academicBackgrounds)
  user?: UserModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
