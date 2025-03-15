import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserModel } from "./user.model";

@Entity("permissions")
export class PermissionModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  // @ManyToMany(() => UserModel, (user) => user.permissions)
  // users?: UserModel[];
}
