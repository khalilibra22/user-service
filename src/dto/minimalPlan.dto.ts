import { Expose } from "class-transformer";

export class MinimalPlanDto {
  @Expose()
  id?: number;

  @Expose()
  name?: string;

  @Expose()
  price?: number;

  @Expose()
  type?: string;
}
