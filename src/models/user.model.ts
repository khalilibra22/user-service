import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from "typeorm";
import { UserRole } from "../enums/userRoles.enum";
import { TeachingMode } from "../enums/teachingModes.enum";
import { UserSettingModel } from "./userSetting.model";
import { AcademicBackgroundModel } from "./academicBackground.model";
import { PaymentMethodModel } from "./paymentMethod.model";
import { UserTopicModel } from "./userTopic.model";
import { PlanModel } from "./plan.model";
import { SubscriptionModel } from "./subscription.model";

@Entity("users")
export class UserModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ unique: true, nullable: true })
  googleId?: string;

  @Column()
  fullname?: string;

  @Column({ unique: true })
  email?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.STUDENT,
    name: "user_role",
  })
  role!: UserRole;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  zipcode?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  address2?: string;

  @Column({ type: "simple-array", nullable: true, name: "teaching_modes" })
  teachingModes?: TeachingMode[];

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ default: "arabic" })
  language?: string;

  @Column({
    name: "time_slot",
    default: 1,
    type: "decimal",
    precision: 5,
    scale: 2,
  })
  timeSlot?: number;

  @Column({ name: "push_notifications", default: true })
  pushNotifications?: boolean;

  @Column({ nullable: true, name: "profile_picture" })
  profilePicture?: string;

  @Column({ nullable: true })
  certificate?: string;

  @Column({ default: false, name: "is_approved" })
  isApproved?: boolean;

  @Column({ default: false, name: "is_active" })
  isActive?: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;

  @OneToOne(() => UserSettingModel, (settings) => settings.user, {
    cascade: true,
  })
  settings?: UserSettingModel;

  @OneToMany(
    () => AcademicBackgroundModel,
    (academicBackground) => academicBackground.user
  )
  academicBackgrounds?: AcademicBackgroundModel[];

  @OneToMany(() => PaymentMethodModel, (paymentMethod) => paymentMethod.user)
  paymentMethods?: PaymentMethodModel[];

  @OneToMany(() => UserTopicModel, (userTopic) => userTopic.user)
  topics?: UserTopicModel[];

  @ManyToOne(() => PlanModel, (plan) => plan.users)
  plan?: PlanModel;

  @OneToMany(() => SubscriptionModel, (subscription) => subscription.user)
  subscriptions?: SubscriptionModel[];
}
