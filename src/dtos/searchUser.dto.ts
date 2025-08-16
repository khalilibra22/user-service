import { Expose, Transform, Type } from "class-transformer";
import { UserRole } from "../enums/userRoles.enum";
import { UserTopicDto } from "./userTopic.dto";

export class SearchUserDto {
  @Expose()
  id?: string;

  @Expose()
  fullname?: string;

  @Expose()
  role?: UserRole;

  @Expose()
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
}
