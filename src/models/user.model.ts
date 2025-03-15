import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { UserRole } from "../enums/userRoles.enum";
import { TeachingMode } from "../enums/teachingModes.enum";
import { UserSettingModel } from "./userSetting.model";
import { PermissionModel } from "./permission.model";

@Entity("users")
export class UserModel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

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

  @Column({ default: false, name: "is_approved" })
  isApproved!: boolean;

  @Column({ default: false, name: "is_active" })
  isActive!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;

  // @ManyToMany(() => PermissionModel, (permission) => permission.users, {
  //   cascade: true,
  // })
  // @JoinTable({ name: "user_permissions" }) // Join table for Many-to-Many
  // permissions?: PermissionModel[];

  @OneToOne(() => UserSettingModel, (settings) => settings.user, {
    cascade: true,
  })
  settings?: UserSettingModel;
}
