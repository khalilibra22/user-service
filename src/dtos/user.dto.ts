import { Expose, Transform } from "class-transformer";
import { TeachingMode } from "../enums/teaching-modes.enum";
import { UserRole } from "../enums/userRoles.enum";
import { getImageUrl } from "../utils";

export class UserDto {
  @Expose()
  id?: string;

  @Expose()
  email?: string;

  @Expose()
  fullname?: string;

  @Expose()
  phoneNumber?: string;

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
  address?: string;

  @Expose()
  address2?: string;

  @Expose()
  gender?: string;

  @Expose()
  language?: string;

  @Expose()
  notifications?: boolean;

  @Expose()
  emailNotifications?: boolean;

  @Expose()
  darkMode?: boolean;

  @Expose()
  teachingModes?: TeachingMode[];

  @Expose()
  bio?: string;

  @Expose()
  @Transform(({ value }) => (value ? getImageUrl(value) : undefined))
  profilePicture?: string;

  @Expose()
  @Transform(({ value }) => (value ? getImageUrl(value) : undefined))
  certificate?: string;

  @Expose({ name: "isActive" })
  isActivated?: boolean;

  @Expose()
  isApproved?: boolean;

  @Expose()
  isSwichable?: boolean;
}
