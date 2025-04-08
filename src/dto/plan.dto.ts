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
  oneOnOneCourseCount?: number;

  @Expose()
  groupCourseCount?: number;

  @Expose()
  liveCourseCount?: number;

  @Expose()
  prerecordedCourseCount?: number;
}
