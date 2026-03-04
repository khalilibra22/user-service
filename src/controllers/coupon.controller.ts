import { Request, Response } from "express";
import { CouponService } from "../services/coupon.service";
import { UserService } from "../services/user.service";
import { CouponDto, CouponValidationResponseDto } from "../dtos/coupon.dto";
import { plainToInstance } from "class-transformer";
import { getLogger } from "../utils/logger";

export class CouponController {
  private couponService: CouponService;
  private userService: UserService;

  constructor() {
    this.couponService = new CouponService();
    this.userService = new UserService();
  }

  // ─── User-scoped CRUD ────────────────────────────────────────────────────────

  createCoupon = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const existingCoupon = await this.couponService.checkUserCoupon(userId, req.body.code);
      if (existingCoupon) {
        res.status(409).json({ error: "Coupon code already exists" });
        return;
      }

      const couponData = { ...req.body, user };
      const coupon = await this.couponService.createCoupon(couponData);
      const couponDto = plainToInstance(CouponDto, coupon, { excludeExtraneousValues: true });
      res.status(201).json(couponDto);
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, "Error creating coupon");
      if (error?.message?.includes("Error creating coupon")) {
        res.status(409).json({ error: "Coupon code already exists" });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };

  updateCoupon = async (req: Request, res: Response): Promise<void> => {
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

      const existingCoupon = await this.couponService.checkUserCoupon(userId, req.body.code);
      if (existingCoupon && coupon?.code !== req.body.code) {
        res.status(409).json({ error: "Coupon code already exists" });
        return;
      }

      const updatedCouponData = { ...coupon, ...req.body, user };
      await this.couponService.updateCoupon(updatedCouponData);
      res.status(200).json({ message: "Coupon updated successfully" });
    } catch (error: any) {
      (req.log || getLogger()).error({ err: error }, "Error updating coupon");
      if (error?.message?.includes("Error updating coupon")) {
        res.status(409).json({ error: "Coupon code already exists" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteCoupon = async (req: Request, res: Response): Promise<void> => {
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
      (req.log || getLogger()).error({ err: error }, "Error deleting coupon");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getUserCoupons = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const coupons = await this.couponService.getUserCoupons(userId);
      const couponDtos = plainToInstance(CouponDto, coupons, { excludeExtraneousValues: true });
      res.status(200).json(couponDtos);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, "Error fetching user coupons");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  toggleCouponStatus = async (req: Request, res: Response): Promise<void> => {
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
      coupon.isActive = !coupon.isActive;
      await this.couponService.updateCoupon(coupon);
      res.status(200).json({
        message: `Coupon status updated to ${coupon.isActive ? "active" : "inactive"}`,
      });
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, "Error toggling coupon status");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // ─── Admin routes (not user-scoped) ─────────────────────────────────────────

  getAllCoupons = async (req: Request, res: Response): Promise<void> => {
    try {
      const coupons = await this.couponService.getAllCoupons();
      const couponDtos = plainToInstance(CouponDto, coupons, { excludeExtraneousValues: true });
      res.status(200).json(couponDtos);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, "Error fetching all coupons");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getCouponByIdAdmin = async (req: Request, res: Response): Promise<void> => {
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
      const couponDto = plainToInstance(CouponDto, coupon, { excludeExtraneousValues: true });
      res.status(200).json(couponDto);
    } catch (error) {
      (req.log || getLogger()).error({ err: error }, "Error fetching coupon");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // ─── Payment integration ─────────────────────────────────────────────────────

  /**
   * POST /v1/coupons/validate
   * Validates a coupon code against an order and returns the computed discount.
   * This is a preview-only endpoint — it does NOT consume the coupon.
   */
  validateCoupon = async (req: Request, res: Response): Promise<void> => {
    try {
      const { couponCode, amount, resourceType, resourceId } = req.body;

      const result = await this.couponService.validateAndComputeDiscount(
        couponCode,
        amount,
        resourceType,
        resourceId
      );

      const response: CouponValidationResponseDto = {
        couponCode: result.coupon.code!,
        couponName: result.coupon.name,
        originalAmount: result.originalAmount,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
        discountType: result.coupon.type!,
        discountValue: Number(result.coupon.discountValue),
      };

      res.status(200).json(response);
    } catch (error: any) {
      const msg: string = error?.message || "Internal Server Error";

      // Map internal error codes to user-friendly HTTP responses
      if (msg.startsWith("COUPON_NOT_FOUND")) {
        res.status(404).json({ error: "Coupon not found" });
      } else if (
        msg.startsWith("COUPON_INACTIVE") ||
        msg.startsWith("COUPON_EXPIRED") ||
        msg.startsWith("COUPON_NOT_STARTED") ||
        msg.startsWith("COUPON_EXHAUSTED") ||
        msg.startsWith("COUPON_WRONG_RESOURCE") ||
        msg.startsWith("COUPON_WRONG_RESOURCE_ID") ||
        msg.startsWith("COUPON_MIN_ORDER")
      ) {
        // Strip the prefix code for the client message
        const clientMessage = msg.replace(/^[A-Z_]+: /, "");
        res.status(422).json({ error: clientMessage });
      } else {
        (req.log || getLogger()).error({ err: error }, "Error validating coupon");
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };
}
