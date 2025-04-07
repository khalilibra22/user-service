import { Expose, Type } from "class-transformer";
import { TopicDto } from "./topic.dto";

export class SubjectDto {
  @Expose()
  id?: number;

  @Expose()
  name?: string;

  @Expose()
  isActived?: boolean;

  @Expose()
  description?: string;

  @Expose()
  @Type(() => TopicDto)
  topics?: TopicDto[];
}
