import { Expose, Type } from "class-transformer";
import { MinimalPlanDto } from "./minimalPlan.dto";
import { MinimalUserDto } from "./minimalUser.dto";

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
