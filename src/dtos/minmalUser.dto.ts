import { Expose, Transform } from "class-transformer";
import { UserRole } from "../enums/userRoles.enum";

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
}
