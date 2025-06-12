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
import { SubjectModel } from "./subject.model";
import { UserTopicModel } from "./userTopic.model";

@Entity("topics")
export class TopicModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name?: string;

  @Column({ default: true, name: "is_active" })
  isActive?: boolean;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => SubjectModel, (subject) => subject.topics)
  subject?: SubjectModel;

  @OneToMany(() => UserTopicModel, (userTopic) => userTopic.topic)
  users?: UserTopicModel[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
