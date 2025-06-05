import { Expose } from "class-transformer";

export class AvailabilityExceptionDto {
  @Expose()
  id?: string;

  @Expose()
  exceptionDate?: Date;

  @Expose()
  startTime?: string;

  @Expose()
  endTime?: string;

  @Expose()
  isAvailable?: boolean;
}
