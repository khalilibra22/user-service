import express from "express";
import { AuthMiddleware } from "../utils/auth.middleware";
import { CouponController } from "../controllers/coupon.controller";

const router = express.Router();

const couponController = new CouponController();

router.get("/:id", AuthMiddleware.verifyToken, async (req, res) =>
  couponController.getCouponById(req, res)
);

router.patch(
  "/:id/toggle-status",
  AuthMiddleware.verifyToken,
  async (req, res) => couponController.toggleCouponStatus(req, res)
);

export { router as couponRouter };
