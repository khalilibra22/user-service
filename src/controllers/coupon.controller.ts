import { Request, Response } from "express";
import { CouponService } from "../services/coupon.service";
import { UserService } from "../services/user.service";
import { CouponDto } from "../dtos/coupon.dto";
import { plainToInstance } from "class-transformer";

export class CouponController {
  private couponService: CouponService;
  private userService: UserService;
  constructor() {
    this.couponService = new CouponService();
    this.userService = new UserService();
  }

  async createCoupon(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const couponData = {
        ...req.body,
        user: user,
      };
      const coupon = await this.couponService.createCoupon(couponData);
      const couponDto = plainToInstance(CouponDto, coupon, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(couponDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async updateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const couponId = Number(req.params.couponId);
      const userId = req.params.id;

      if (isNaN(couponId)) {
        res.status(400).json({ error: "Invalid coupon ID" });
        return;
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const coupon = await this.couponService.getCouponById(couponId);
      if (!coupon) {
        res.status(404).json({ error: "Coupon not found" });
        return;
      }
      const updatedCouponData = {
        ...coupon,
        ...req.body,
        user: user,
      };
      await this.couponService.updateCoupon(updatedCouponData);
      res.status(200).json({ message: "Coupon updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async deleteCoupon(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.couponId);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid coupon ID" });
        return;
      }
      const coupon = await this.couponService.getCouponById(id);
      if (!coupon) {
        res.status(404).json({ error: "Coupon not found" });
        return;
      }
      await this.couponService.deleteCoupon(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getCouponById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid coupon ID" });
        return;
      }
      const coupon = await this.couponService.getCouponById(id);
      if (!coupon) {
        res.status(404).json({ error: "Coupon not found" });
        return;
      }
      const couponDto = plainToInstance(CouponDto, coupon, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(couponDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getUserCoupons(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const coupons = await this.couponService.getUserCoupons(userId);
      const couponDtos = plainToInstance(CouponDto, coupons, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(couponDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async toggleCouponStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid coupon ID" });
        return;
      }
      const coupon = await this.couponService.getCouponById(id);
      if (!coupon) {
        res.status(404).json({ error: "Coupon not found" });
        return;
      }
      coupon.isActive = !coupon.isActive;
      await this.couponService.updateCoupon(coupon);
      res.status(200).json({
        message: `Coupon status updated to ${
          coupon.isActive ? "active" : "inactive"
        }`,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
