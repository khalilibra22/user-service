import express from "express";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { CouponController } from "../../controllers/coupon.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { couponValidationSchema } from "../../validations/coupon.validation";

const router = express.Router();

const couponController = new CouponController();

router.post(
    "/",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("coupons", "create"),
    ValidationMiddleware.validate(couponValidationSchema),
    couponController.createCoupon
  );
  
  router.put(
    "/:couponId",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("coupons", "update"),
    ValidationMiddleware.validate(couponValidationSchema),
    couponController.updateCoupon
  );
  
  router.delete(
    "/:couponId",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("coupons", "delete"),
    couponController.deleteCoupon
  );
  
  router.get(
    "/",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("coupons", "list"),
    couponController.getUserCoupons
  );

export { router as couponRouter };