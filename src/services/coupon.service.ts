import { AppDataSource } from "../config/database";
import { CouponModel } from "../models/coupon.model";

export class CouponService {
  couponRepo: any;

  constructor() {
    this.couponRepo = AppDataSource.getRepository(CouponModel);
  }
  async createCoupon(coupon: CouponModel): Promise<CouponModel> {
    try {
      return await this.couponRepo.save(coupon);
    } catch (error) {
      console.error(error);
      throw new Error("Error creating coupon");
    }
  }
  async updateCoupon(coupon: CouponModel): Promise<void> {
    try {
      return await this.couponRepo.save(coupon);
    } catch (error) {
      console.error(error);
      throw new Error("Error updating coupon");
    }
  }

  async getCouponById(id: number): Promise<CouponModel | undefined> {
    try {
      return await this.couponRepo.findOne({
        where: {
          id: id,
        },
        cache: {
          id: `coupon_${id}`,
          milliseconds: 900000, // 15 minutes
        },
      });
    } catch (error) {
      throw new Error("Error fetching coupon");
    }
  }

  async getAllCoupons(): Promise<CouponModel[]> {
    try {
      return await this.couponRepo.find({
        cache: {
          id: 'all_coupons',
          milliseconds: 900000, // 15 minutes
        },
      });
    } catch (error) {
      throw new Error("Error fetching coupons");
    }
  }

  async deleteCoupon(id: number): Promise<void> {
    try {
      await this.couponRepo.softDelete(id);
    } catch (error) {
      console.error(error);
      throw new Error("Error deleting coupon");
    }
  }

  async getUserCoupons(userId: string): Promise<CouponModel[]> {
    try {
      return await this.couponRepo.find({
        where: {
          user: {
            id: userId,
          },
        },
        cache: {
          id: `user_coupons_${userId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching user coupons");
    }
  }

  async checkUserCoupon(userId: string, couponCode: number): Promise<boolean> {
    try {
      const coupon = await this.couponRepo.findOne({
        where: {
          code: couponCode,
          user: {
            id: userId,
          },
        },
        cache: {
          id: `user_coupon_check_${userId}_${couponCode}`,
          milliseconds: 180000, // 3 minutes
        },
      });
      return !!coupon;
    } catch (error) {
      console.error(error);
      throw new Error("Error checking user coupon");
    }
  }
}
