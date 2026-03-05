import express from "express";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { CouponController } from "../../controllers/coupon.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { couponValidationSchema, validateCouponSchema } from "../../validations/coupon.validation";

const router = express.Router({ mergeParams: true });
const couponController = new CouponController();

// ─── Payment integration: validate coupon (preview discount, no user scope) ───
// POST /v1/coupons/validate
router.post(
  "/validate",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(validateCouponSchema),
  couponController.validateCoupon
);

// ─── Admin: list / get all coupons (not user-scoped) ─────────────────────────
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
  AuthMiddleware.authorize("coupons", "read"),
  couponController.getCouponByIdAdmin
);

// ─── User-scoped CRUD (mounted under /v1/users/:id/coupons) ──────────────────
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
