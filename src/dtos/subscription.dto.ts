import { Expose, Type } from "class-transformer";
import { MinimalPlanDto } from "./minimal-plan.dto";
import { SubscriptionUserDto } from "./subscription-user.dto";

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
  @Type(() => SubscriptionUserDto)
  user?: SubscriptionUserDto;

  @Expose()
  @Type(() => MinimalPlanDto)
  plan?: MinimalPlanDto;
}
