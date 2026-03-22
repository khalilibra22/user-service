import express from "express";
import { container } from "../../container";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { CouponController } from "../../controllers/coupon.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { couponValidationSchema, validateCouponSchema } from "../../validations/coupon.validation";

const router = express.Router({ mergeParams: true });
const couponController = container.resolve(CouponController);

// â”€â”€â”€ Payment integration: validate coupon (preview discount, no user scope) â”€â”€â”€
// POST /v1/coupons/validate
router.post(
  "/validate",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(validateCouponSchema),
  couponController.validateCoupon
);

// â”€â”€â”€ Admin: list / get all coupons (not user-scoped) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET  /v1/coupons
router.get(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelfOrAdmin,
  AuthMiddleware.authorize("coupons", "list"),
  couponController.getAllCoupons
);

// GET  /v1/coupons/:couponId
router.get(
  "/:couponId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelfOrAdmin,
  AuthMiddleware.authorize("coupons", "read"),
  couponController.getCouponByIdAdmin
);

// â”€â”€â”€ User-scoped CRUD (mounted under /v1/users/:id/coupons) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /v1/users/:id/coupons
router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("coupons", "create"),
  ValidationMiddleware.validate(couponValidationSchema),
  couponController.createCoupon
);

// PUT  /v1/users/:id/coupons/:couponId
router.put(
  "/:couponId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("coupons", "update"),
  ValidationMiddleware.validate(couponValidationSchema),
  couponController.updateCoupon
);

// DELETE /v1/users/:id/coupons/:couponId
router.delete(
  "/:couponId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("coupons", "delete"),
  couponController.deleteCoupon
);

// PATCH /v1/users/:id/coupons/:couponId/toggle
router.patch(
  "/:couponId/toggle",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSelf,
  AuthMiddleware.authorize("coupons", "update"),
  couponController.toggleCouponStatus
);

export { router as couponRouter };

