import express from "express";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { CouponController } from "../../controllers/coupon.controller";

const router = express.Router();

const couponController = new CouponController();

router.get(
  "/:couponId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("coupons", "read"),
  async (req, res) => couponController.getCouponById(req, res)
);

router.patch(
  "/:couponId/toggle-status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("coupons", "toggle"),
  async (req, res) => couponController.toggleCouponStatus(req, res)
);

export { router as couponRouter };
