import { Expose } from "class-transformer";

export class TopicDto {
  @Expose()
  id?: number;

  @Expose()
  name?: string;

  @Expose()
  isActive?: boolean;

  @Expose()
  description?: string;
}
