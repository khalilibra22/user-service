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
      });
    } catch (error) {
      throw new Error("Error fetching coupon");
    }
  }

  async getAllCoupons(): Promise<CouponModel[]> {
    try {
      return await this.couponRepo.find();
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
      });
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching user coupons");
    }
  }
}
