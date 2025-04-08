import { Expose } from "class-transformer";
import { UserRole } from "../enums/userRoles.enum";

export class MinimalUserDto {
  @Expose()
  id?: string;

  @Expose()
  fullname?: string;

  @Expose()
  role?: UserRole;
}
