import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SubjectModel } from "./subject.model";

@Entity("categories")
export class CategoryModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name?: string;

  @Column({ default: true, name: "is_actived" })
  isActived!: boolean;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => SubjectModel, (subject) => subject.category)
  subjects?: SubjectModel[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
