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
import { TopicModel } from "./topic.model";
import { UserModel } from "./user.model";

@Entity("user_topics")
@Index("IDX_user_topics_user_id", ["user"])
@Index("IDX_user_topics_topic_id", ["topic"])
@Index("IDX_user_topics_is_active", ["isActive"])
@Index("IDX_user_topics_user_active", ["user", "isActive"])
export class UserTopicModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => TopicModel, (topic) => topic.users)
  topic?: TopicModel;

  @ManyToOne(() => UserModel, (user) => user.topics)
  user?: UserModel;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price?: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive?: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
