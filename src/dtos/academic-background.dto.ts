import { Exclude, Expose, Transform, Type } from "class-transformer";
import { UserDto } from "./user.dto";
import { getS3Url } from "../utils";

export class AcademicBackgroundDto {
  @Expose()
  id?: number;

  @Expose()
  type?: string;

  @Expose()
  title?: string;

  @Expose()
  description?: string;

  @Expose()
  startDate?: Date;

  @Expose()
  endDate?: Date;

  @Expose()
  institution?: string;

  @Expose()
  location?: string;

  @Expose()
  @Transform(({ value }) => (value ? getS3Url(value) : undefined))
  documentUrl?: string;

  @Expose()
  isVerified?: boolean;

  @Exclude()
  @Type(() => UserDto)
  user?: UserDto;
}
