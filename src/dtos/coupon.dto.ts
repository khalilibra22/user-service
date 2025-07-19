import { Expose, Transform, Type } from "class-transformer";

export class CouponDto {
  @Expose()
  id?: number;

  @Expose()
  name?: string;

  @Expose()
  code?: string;

  @Expose()
  type?: string;

  @Expose()
  discountValue?: number;

  @Expose()
  usageLimit?: number;

  @Expose()
  startDate?: Date;

  @Expose()
  expiryDate?: Date;

  @Expose()
  isActive?: boolean;

  @Expose()
  applicableResource?: string;

  @Expose()
  @Transform(({ value }) => {
    return value === null ? undefined : value;
  })
  resourceIds?: string[];
}
