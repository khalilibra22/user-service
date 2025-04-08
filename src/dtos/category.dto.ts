import { Expose, Type } from "class-transformer";
import { SubjectDto } from "./subject.dto";

export class CategoryDto {
  @Expose()
  id?: number;

  @Expose()
  name?: string;

  @Expose()
  isActived?: boolean;

  @Expose()
  description?: string;

  @Expose()
  @Type(() => SubjectDto)
  subjects?: SubjectDto[];
}
