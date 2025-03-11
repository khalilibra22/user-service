import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { UserRole } from "../enums/userRoles.enum";
import { TeachingMode } from "../enums/teachingModes.enum";

@Entity("users")
export class UserModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullname!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  phoneNumber!: string;

  @Column()
  password!: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.STUDENT,
    name: "user_role",
  })
  role!: UserRole;

  @Column({ nullable: true })
  state!: string;

  @Column({ nullable: true })
  city!: string;

  @Column({ nullable: true })
  zipcode!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ type: "simple-array", nullable: true, name: "teaching_modes" })
  teachingModes!: TeachingMode[];

  @Column({ nullable: true })
  bio!: string;

  @Column({ nullable: true, name: "profile_picture" })
  profilePicture!: string;

  @Column({ nullable: true })
  certificate!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
