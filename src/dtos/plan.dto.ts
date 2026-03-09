import { Expose } from "class-transformer";

export class PlanDto {
  @Expose()
  id?: number;

  @Expose()
  name?: string;

  @Expose()
  description?: string;

  @Expose()
  price?: number;

  @Expose()
  type?: string; // 'free' | 'pro' | 'premium'

  @Expose()
  isActive?: boolean;

  @Expose()
  duration?: number;

  @Expose()
  durationUnit?: string; // 'months' | 'years'

  @Expose()
  groupCourseCount?: number;

  @Expose()
  liveCourseCount?: number;

  @Expose()
  oneOnOneFeePercentage?: number;

  @Expose()
  prerecordedFeePercentage?: number;

  @Expose()
  hasProBadge?: boolean;

  @Expose()
  isListedInDistinguished?: boolean;

  @Expose()
  hasSearchPriority?: boolean;

  @Expose()
  hasPageCustomization?: boolean;
}
