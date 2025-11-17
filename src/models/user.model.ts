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
  Index,
} from "typeorm";
import { UserRole } from "../enums/userRoles.enum";
import { TeachingMode } from "../enums/teaching-modes.enum";
import { UserSettingModel } from "./user-setting.model";
import { AcademicBackgroundModel } from "./academic-background.model";
import { PaymentMethodModel } from "./payment-method.model";
import { UserTopicModel } from "./user-topic.model";
import { PlanModel } from "./plan.model";
import { SubscriptionModel } from "./subscription.model";
import { AvailabilityModel } from "./availability.model";
import { AvailabilityExceptionModel } from "./availability-exception.model";
import { CouponModel } from "./coupon.model";

@Entity("users")
@Index("IDX_users_role", ["role"])
@Index("IDX_users_email", ["email"])
@Index("IDX_users_google_id", ["googleId"])
@Index("IDX_users_is_active", ["isActive"])
@Index("IDX_users_is_approved", ["isApproved"])
@Index("IDX_users_created_at", ["createdAt"])
@Index("IDX_users_role_active", ["role", "isActive"])
@Index("IDX_users_role_approved", ["role", "isApproved"])
@Index("IDX_users_location", ["state", "city", "district"])
@Index("IDX_users_gps_location", ["latitude", "longitude"])
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
  district?: string;

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

  //contact email
  @Column({ nullable: true, name: "contact_email" })
  contactEmail?: string;

  @Column({ nullable: true, name: "contact_phone_number" })
  contactPhoneNumber?: string;

  //secondary contact phone number
  @Column({ nullable: true, name: "secondary_contact_phone_number" })
  secondaryContactPhoneNumber?: string;

  //watsapp number
  @Column({ nullable: true, name: "whatsapp_number" })
  whatsappNumber?: string;

  //website
  @Column({ nullable: true })
  website?: string;

  @Column({ name: "dark_mode", default: false })
  darkMode?: boolean;

  @Column({ name: "notifications", default: true })
  notifications?: boolean;

  @Column({ name: "email_notifications", default: true })
  emailNotifications?: boolean;

  @Column({ default: false, name: "is_approved" })
  isApproved?: boolean;

  @Column({ default: false, name: "is_active" })
  isActive?: boolean;

  @Column({ default: false, name: "is_swichable" })
  isSwichable?: boolean;

  @Column({ nullable: true, name: "fcm_token" })
  fcmToken?: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 8,
    nullable: true,
  })
  latitude?: number;

  @Column({
    type: "decimal",
    precision: 11,
    scale: 8,
    nullable: true,
  })
  longitude?: number;

  @Column({ type: "tsvector", nullable: true, select: false, name: "search_vector" })
  searchVector?: any;

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

  @OneToMany(() => CouponModel, (coupon) => coupon.user)
  coupons?: CouponModel[];

  @OneToMany(() => AvailabilityModel, (availability) => availability.user)
  availabilities?: AvailabilityModel[];

  @OneToMany(
    () => AvailabilityExceptionModel,
    (availabilityException) => availabilityException.user
  )
  availabilityExceptions?: AvailabilityExceptionModel[];

  @OneToMany(() => PaymentMethodModel, (paymentMethod) => paymentMethod.user)
  paymentMethods?: PaymentMethodModel[];

  @OneToMany(() => UserTopicModel, (userTopic) => userTopic.user)
  topics?: UserTopicModel[];

  @ManyToOne(() => PlanModel, (plan) => plan.users)
  plan?: PlanModel;

  @OneToMany(() => SubscriptionModel, (subscription) => subscription.user)
  subscriptions?: SubscriptionModel[];
}
