import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SubjectModel } from "./subject.model";

@Entity("topics")
export class TopicModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name?: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price?: number;

  @Column({ default: true, name: "is_actived" })
  isActived!: boolean;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => SubjectModel, (subject) => subject.topics)
  subject?: SubjectModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
