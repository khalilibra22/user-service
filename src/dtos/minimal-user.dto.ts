import { Expose } from "class-transformer";
import { UserRole } from "../enums/userRoles.enum";

export class MinimalUserDto {
  @Expose()
  id?: string;

  @Expose()
  fullname?: string;

  @Expose()
  phoneNumber?: string;

  @Expose()
  address?: string;

  @Expose()
  email?: string;

  @Expose()
  role?: UserRole;

  @Expose()
  state?: string;

  @Expose()
  district?: string;

  @Expose()
  city?: string;

  @Expose()
  zipcode?: string;

  @Expose()
  address2?: string;

  @Expose()
  pushNotifications?: boolean;

  @Expose()
  gender?: string;

  @Expose()
  language?: string;

  @Expose()
  fcmToken?: string;
}
