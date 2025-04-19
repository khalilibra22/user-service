import { Expose, Type } from "class-transformer";
import { TopicDto } from "./topic.dto";
import { UserDto } from "./user.dto";

export class UserTopicDto {
  @Expose()
  id?: number;

  @Expose()
  price?: number;

  @Expose()
  @Type(() => TopicDto)
  topic?: TopicDto;

  @Expose()
  @Type(() => UserDto)
  user?: UserDto;
}
