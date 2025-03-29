import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserModel } from "./user.model";

@Entity("user_settings")
export class UserSettingModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "dark_mode", default: false })
  darkMode!: boolean;

  @Column({ name: "email_notifications", default: true })
  emailNotifications!: boolean;

  @Column({ name: "push_notifications", default: true })
  pushNotifications!: boolean;

  @Column({ default: "arabic" })
  language!: string;

  @Column({
    name: "time_slot",
    default: 1,
    type: "decimal",
    precision: 5,
    scale: 2,
  })
  timeSlot!: number;

  @Column({ name: "is_accept_terms", default: false })
  isAcceptTerms!: boolean;

  @OneToOne(() => UserModel, (user) => user.settings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: UserModel;
}
