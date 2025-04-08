import { Expose, Type } from "class-transformer";
import { MinimalPlanDto } from "./minimalPlan.dto";

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
  @Type(() => MinimalPlanDto)
  plan?: MinimalPlanDto;
}
