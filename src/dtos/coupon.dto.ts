import { Expose, Transform } from "class-transformer";

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
  maxDiscountAmount?: number;

  @Expose()
  minOrderAmount?: number;

  @Expose()
  usageLimit?: number;

  @Expose()
  usedCount?: number;

  @Expose()
  startDate?: Date;

  @Expose()
  expiryDate?: Date;

  @Expose()
  isActive?: boolean;

  @Expose()
  applicableResource?: string;

  @Expose()
  @Transform(({ value }) => (value === null ? undefined : value))
  resourceIds?: string[];
}

export class CouponValidationResponseDto {
  couponCode!: string;
  originalAmount!: number;
  discountAmount!: number;
  finalAmount!: number;
  discountType!: string;
  discountValue!: number;
  couponName?: string;
}
