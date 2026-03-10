import { AppDataSource } from "../config/database";
import { CouponModel } from "../models/coupon.model";
import { getLogger } from "../utils/logger";

const log = getLogger();

export interface CouponValidationResult {
  coupon: CouponModel;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export class CouponService {
  couponRepo: any;

  constructor() {
    this.couponRepo = AppDataSource.getRepository(CouponModel);
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async createCoupon(coupon: CouponModel): Promise<CouponModel> {
    try {
      return await this.couponRepo.save(coupon);
    } catch (error) {
      log.error({ err: error, ctx: { service: "CouponService", op: "createCoupon" } }, "Error creating coupon");
      throw new Error("Error creating coupon");
    }
  }

  async updateCoupon(coupon: CouponModel): Promise<void> {
    try {
      return await this.couponRepo.save(coupon);
    } catch (error) {
      log.error({ err: error, ctx: { service: "CouponService", op: "updateCoupon" } }, "Error updating coupon");
      throw new Error("Error updating coupon");
    }
  }

  async getCouponById(id: number): Promise<CouponModel | undefined> {
    try {
      return await this.couponRepo.findOne({
        where: { id },
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: "CouponService", op: "getCouponById", couponId: id } }, "Error fetching coupon");
      throw new Error("Error fetching coupon");
    }
  }

  async getCouponByCode(code: string): Promise<CouponModel | null> {
    try {
      return await this.couponRepo.findOne({
        where: { code },
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: "CouponService", op: "getCouponByCode", code } }, "Error fetching coupon by code");
      throw new Error("Error fetching coupon by code");
    }
  }

  async getAllCoupons(): Promise<CouponModel[]> {
    try {
      return await this.couponRepo.find({
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: "CouponService", op: "getAllCoupons" } }, "Error fetching coupons");
      throw new Error("Error fetching coupons");
    }
  }

  async deleteCoupon(id: number): Promise<void> {
    try {
      await this.couponRepo.softDelete(id);
    } catch (error) {
      log.error({ err: error, ctx: { service: "CouponService", op: "deleteCoupon", couponId: id } }, "Error deleting coupon");
      throw new Error("Error deleting coupon");
    }
  }

  async getUserCoupons(userId: string): Promise<CouponModel[]> {
    try {
      return await this.couponRepo.find({
        where: { user: { id: userId } },
        cache: false,
      });
    } catch (error) {
      log.error({ err: error, ctx: { service: "CouponService", op: "getUserCoupons", userId } }, "Error fetching user coupons");
      throw new Error("Error fetching user coupons");
    }
  }

  async checkUserCoupon(userId: string, couponCode: string): Promise<boolean> {
    try {
      const coupon = await this.couponRepo.findOne({
        where: { code: couponCode, user: { id: userId } },
        cache: false,
      });
      return !!coupon;
    } catch (error) {
      log.error({ err: error, ctx: { service: "CouponService", op: "checkUserCoupon", userId, couponCode } }, "Error checking user coupon");
      throw new Error("Error checking user coupon");
    }
  }

  // ─── Payment Integration ─────────────────────────────────────────────────────

  /**
   * Validates a coupon code against an order and computes the discount.
   * Throws a descriptive error for every invalid state.
   */
  async validateAndComputeDiscount(
    couponCode: string,
    orderAmount: number,
    resourceType?: string,
    resourceId?: string
  ): Promise<CouponValidationResult> {
    // Fetch fresh (no-cache) to ensure we don't apply an already-exhausted coupon
    const coupon = await this.couponRepo.findOne({ where: { code: couponCode } });

    if (!coupon) {
      throw new Error("COUPON_NOT_FOUND: Coupon code not found");
    }

    if (!coupon.isActive) {
      throw new Error("COUPON_INACTIVE: Coupon is not active");
    }

    const now = new Date();

    if (coupon.startDate && new Date(coupon.startDate) > now) {
      throw new Error("COUPON_NOT_STARTED: Coupon is not yet valid");
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      throw new Error("COUPON_EXPIRED: Coupon has expired");
    }

    if (coupon.usageLimit !== undefined && coupon.usedCount !== undefined && coupon.usedCount >= coupon.usageLimit) {
      throw new Error("COUPON_EXHAUSTED: Coupon has reached its usage limit");
    }

    // Resource type restriction
    if (coupon.applicableResource && coupon.applicableResource !== "all") {
      if (resourceType && coupon.applicableResource !== resourceType) {
        throw new Error(`COUPON_WRONG_RESOURCE: Coupon is only valid for ${coupon.applicableResource} resources`);
      }
      // Resource-specific coupon — check if the specific resource ID is allowed
      if (
        coupon.resourceIds &&
        coupon.resourceIds.length > 0 &&
        resourceId &&
        !coupon.resourceIds.includes(resourceId)
      ) {
        throw new Error("COUPON_WRONG_RESOURCE_ID: Coupon is not valid for this specific resource");
      }
    }

    // Minimum order amount check
    if (coupon.minOrderAmount !== undefined && coupon.minOrderAmount !== null) {
      if (orderAmount < Number(coupon.minOrderAmount)) {
        throw new Error(
          `COUPON_MIN_ORDER: Order amount must be at least ${coupon.minOrderAmount} to use this coupon`
        );
      }
    }

    // Compute raw discount
    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = (orderAmount * Number(coupon.discountValue)) / 100;
    } else {
      // fixed amount
      discountAmount = Number(coupon.discountValue);
    }

    // Apply maxDiscountAmount cap
    if (coupon.maxDiscountAmount !== undefined && coupon.maxDiscountAmount !== null) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
    }

    // Discount cannot exceed the order amount
    discountAmount = Math.min(discountAmount, orderAmount);
    discountAmount = Math.round(discountAmount * 100) / 100; // round to 2 dp

    const finalAmount = Math.round((orderAmount - discountAmount) * 100) / 100;

    return { coupon, originalAmount: orderAmount, discountAmount, finalAmount };
  }

  /**
   * Atomically increments usedCount and deactivates the coupon if the limit is reached.
   * Called after a successful payment.
   */
  async applyCouponUsage(couponCode: string): Promise<void> {
    try {
      await AppDataSource.transaction(async (em) => {
        // Lock the row to prevent race conditions
        const coupon = await em
          .getRepository(CouponModel)
          .createQueryBuilder("c")
          .setLock("pessimistic_write")
          .where("c.code = :code", { code: couponCode })
          .getOne();

        if (!coupon) return; // Coupon deleted in the meantime — nothing to do

        coupon.usedCount = (coupon.usedCount ?? 0) + 1;
        if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
          coupon.isActive = false;
        }

        await em.save(CouponModel, coupon);
      });

      // Invalidate caches
      await this.invalidateCouponCache(couponCode);

      log.info({ couponCode }, "Coupon usage applied");
    } catch (error) {
      log.error({ err: error, couponCode }, "Error applying coupon usage");
      // Non-fatal — do not re-throw (payment already succeeded)
    }
  }

  /**
   * Rolls back usage if a payment failed after the coupon was reserved.
   * Also re-activates the coupon if it was deactivated.
   * Idempotent — safe to call even if applyCouponUsage was never called.
   */
  async rollbackCouponUsage(couponCode: string): Promise<void> {
    try {
      await AppDataSource.transaction(async (em) => {
        const coupon = await em
          .getRepository(CouponModel)
          .createQueryBuilder("c")
          .setLock("pessimistic_write")
          .where("c.code = :code", { code: couponCode })
          .getOne();

        if (!coupon || !coupon.usedCount || coupon.usedCount <= 0) return;

        coupon.usedCount = coupon.usedCount - 1;
        // Re-activate if it was deactivated due to reaching the limit
        if (
          !coupon.isActive &&
          coupon.usageLimit !== undefined &&
          coupon.usedCount < coupon.usageLimit
        ) {
          coupon.isActive = true;
        }

        await em.save(CouponModel, coupon);
      });

      await this.invalidateCouponCache(couponCode);

      log.info({ couponCode }, "Coupon usage rolled back");
    } catch (error) {
      log.error({ err: error, couponCode }, "Error rolling back coupon usage");
      // Non-fatal
    }
  }

  // ─── Cache helpers ────────────────────────────────────────────────────────────

  private async invalidateCouponCache(couponCode: string): Promise<void> {
    try {
      if (AppDataSource.queryResultCache) {
        await AppDataSource.queryResultCache.remove([
          `coupon_code_${couponCode}`,
          "all_coupons",
        ]);
      }
    } catch {
      // Cache invalidation failure is non-fatal
    }
  }
}
