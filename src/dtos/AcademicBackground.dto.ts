import { Exclude, Expose, Transform, Type } from "class-transformer";
import { getImageUrl } from "../utils"; // assuming you're using this for certificate transformation
import { UserDto } from "./user.dto"; // optional: include only if needed

export class AcademicBackgroundDto {
  @Expose()
  id?: number;

  @Expose()
  title?: string;

  @Expose()
  description?: string;

  @Expose()
  startDate?: Date;

  @Expose()
  endDate?: Date;

  @Expose()
  isVerified?: boolean;

  @Expose()
  institution?: string;

  @Expose()
  ordering?: number;

  @Expose()
  @Transform(({ value }) => (value ? getImageUrl(value) : undefined))
  certificate?: string;

  @Exclude()
  @Type(() => UserDto)
  user?: UserDto;
}
