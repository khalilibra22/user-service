import { UnorderedBulkOperation } from "typeorm";
import { TeachingMode } from "../enums/teachingModes.enum";
import { UserRole } from "../enums/userRoles.enum";
import { UserModel } from "../models/user.model";

export class UserDto {
  id?: number;
  email?: string;
  fullname?: string;
  phoneNumber?: string;
  role?: UserRole;
  state?: string;
  city?: string;
  zipcode?: string;
  address?: string;
  teachingModes?: TeachingMode[];
  bio?: string;
  profilePicture?: string;
  certificate?: string;

  constructor(user: UserModel) {
    this.id = user.id;
    this.email = user.email;
    this.fullname = user.fullname;
    this.phoneNumber = user.phoneNumber;
    this.role = user.role;
    this.state = user.state || undefined;
    this.city = user.city || undefined;
    this.zipcode = user.zipcode || undefined;
    this.address = user.address || undefined;
    this.teachingModes = user.teachingModes || undefined;
    this.bio = user.bio || undefined;
    this.profilePicture = user.profilePicture || undefined;
    this.certificate = user.certificate || undefined;
  }
}
