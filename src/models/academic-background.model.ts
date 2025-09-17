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
import { UserModel } from "./user.model";

@Entity("academic_backgrounds")
@Index("IDX_academic_backgrounds_user_id", ["user"])
@Index("IDX_academic_backgrounds_type", ["type"])
@Index("IDX_academic_backgrounds_is_verified", ["isVerified"])
@Index("IDX_academic_backgrounds_start_date", ["startDate"])
@Index("IDX_academic_backgrounds_end_date", ["endDate"])
export class AcademicBackgroundModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ default: "education" })
  type?: string; //"exprience" | "education" | "certification";

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

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true, name: "document_url" })
  documentUrl?: string;

  @ManyToOne(() => UserModel, (user) => user.academicBackgrounds)
  user?: UserModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
