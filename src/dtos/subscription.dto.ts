import { Expose, Type } from "class-transformer";
import { MinimalPlanDto } from "./minimal-plan.dto";
import { MinimalUserDto } from "./minimal-user.dto";

export class SubscriptionDto {
  @Expose()
  id?: number;

  @Expose()
  startDate?: Date;

  @Expose()
  endDate?: Date;

  @Expose()
  status?: string;

  @Expose()
  @Type(() => MinimalUserDto)
  user?: MinimalUserDto;

  @Expose()
  @Type(() => MinimalPlanDto)
  plan?: MinimalPlanDto;
}
