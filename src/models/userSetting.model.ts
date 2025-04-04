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

  @Column({ name: "is_accept_terms", default: false })
  isAcceptTerms!: boolean;

  @OneToOne(() => UserModel, (user) => user.settings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: UserModel;
}
