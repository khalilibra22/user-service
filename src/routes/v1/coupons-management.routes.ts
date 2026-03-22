import express from "express";
import { container } from "../../container";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { CouponController } from "../../controllers/coupon.controller";

const router = express.Router();

const couponController = container.resolve(CouponController);

router.get(
  "/:couponId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("coupons", "read"),
  couponController.getCouponByIdAdmin
);

router.patch(
  "/:couponId/toggle-status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("coupons", "toggle"),
  couponController.toggleCouponStatus
);

export { router as couponManagementRouter };

