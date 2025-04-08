import { Expose, Transform } from "class-transformer";
import { TeachingMode } from "../enums/teachingModes.enum";
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
  city?: string;

  @Expose()
  zipcode?: string;

  @Expose()
  address?: string;

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
}

// export class UserDto {
//   id?: string;
//   email?: string;
//   fullname?: string;
//   phoneNumber?: string;
//   role?: UserRole;
//   state?: string;
//   city?: string;
//   zipcode?: string;
//   address?: string;
//   teachingModes?: TeachingMode[];
//   bio?: string;
//   profilePicture?: string;
//   certificate?: string;
//   isActivated?: boolean;
//   isApproved?: boolean;

//   constructor(user: UserModel) {
//     this.id = user.id;
//     this.email = user.email;
//     this.fullname = user.fullname;
//     this.phoneNumber = user.phoneNumber;
//     this.role = user.role;
//     this.state = user.state || undefined;
//     this.city = user.city || undefined;
//     this.zipcode = user.zipcode || undefined;
//     this.address = user.address || undefined;
//     this.teachingModes = user.teachingModes || undefined;
//     this.bio = user.bio || undefined;
//     this.profilePicture =
//       user.profilePicture != null
//         ? getImageUrl(user.profilePicture)
//         : undefined;
//     this.certificate =
//       user.certificate != null ? getImageUrl(user.certificate) : undefined;
//     this.isActivated = user.isActive;
//     this.isApproved = user.isApproved;
//   }
// }
