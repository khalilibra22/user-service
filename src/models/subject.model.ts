import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CategoryModel } from "./category.model";
import { TopicModel } from "./topic.model";

@Entity("subjects")
export class SubjectModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name?: string;

  @Column({ default: true, name: "is_actived" })
  isActived!: boolean;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => CategoryModel, (category) => category.subjects)
  category?: CategoryModel;

  @OneToMany(() => TopicModel, (topic) => topic.subject)
  topics?: TopicModel[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
