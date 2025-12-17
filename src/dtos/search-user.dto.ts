import { Expose, Transform, Type } from "class-transformer";
import { UserRole } from "../enums/userRoles.enum";
import { UserTopicDto } from "./user-topic.dto";
import { getS3Url } from "../utils";

export class SearchUserDto {
  @Expose()
  id?: string;

  @Expose()
  fullname?: string;

  @Expose()
  @Transform(({ value }) => (value ? getS3Url(value) : undefined))
  profilePicture?: string;

  @Expose()
  role?: UserRole;

  @Expose()
  @Transform(() => Math.floor(Math.random() * 5) + 1)
  rating?: number;

  @Expose()
  state?: string;

  @Expose()
  district?: string;

  @Expose()
  city?: string;

  @Expose()
  address?: string;

  @Expose()
  bio?: string;

  @Expose()
  teachingModes?: number[];

  @Expose()
  @Transform(() => {
    return 0;
  })
  coursesCount?: number;

  @Expose()
  @Transform(() => {
    return 0;
  })
  studentsCount?: number;

  @Expose()
  @Transform(({ obj }) => obj.createdAt)
  registrationDate?: Date;

  @Expose()
  @Type(() => UserTopicDto)
  topics?: UserTopicDto[];

  // feild for is available or not
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.availabilities) return undefined;
    return obj.availabilities?.some((a: any) => a.isAvailable);
  })
  isAvailable?: boolean;

}
