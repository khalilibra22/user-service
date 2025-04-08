import { Expose, Type } from "class-transformer";

export class TopicDto {
  @Expose()
  id?: number;

  @Expose()
  name?: string;

  @Expose()
  isActived?: boolean;

  @Expose()
  description?: string;
}
