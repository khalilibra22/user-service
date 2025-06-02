import { Expose } from "class-transformer";

export class AvailabilityDto {
  @Expose()
  id?: string;

  @Expose()
  dayOfWeek?: string;

  @Expose()
  startTime?: string;

  @Expose()
  endTime?: string;

  @Expose()
  isAvailable?: boolean;
}
