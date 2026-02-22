import express, { Request, Response, NextFunction } from "express";
import { authRouter } from "../routes/v1/auth.routes";
import { categoriesRouter } from "../routes/v1/category.routes";
import { couponRouter } from "../routes/v1/coupon.routes";
import { couponManagementRouter } from "../routes/v1/coupons-management.routes";
import { searchRouter } from "../routes/v1/search.routes";
import { subscriptionRouter } from "../routes/v1/subscription.routes";
import { userRouter } from "../routes/v1/user.routes";
import path from "path";
import passport from "passport";
import session from "express-session";
import { inboundRouter } from "../routes/v1/inbound.routes";
import { paymentRouter } from "../routes/v1/payment.routes";
import { adminPaymentRouter } from "../routes/v1/admin-payment.routes";
import withdrawalRouter from "../routes/v1/withdrawal.routes";

const app = express.Router();

// ── Session secret must come from env ────────────────────────────────────
if (!process.env.SESSION_SECRET) {
  throw new Error("[CONFIG] SESSION_SECRET environment variable is not set.");
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ── Internal API-key guard for inbound (service-to-service) routes ────────
const requireInboundKey = (req: Request, res: Response, next: NextFunction): void => {
  const INBOUND_API_KEY = process.env.INBOUND_API_KEY;
  console.log(`[AUTH] user-service requireInboundKey check. Key in env: ${INBOUND_API_KEY}`);

  if (!INBOUND_API_KEY) {
    // Key not configured → block all requests (fail secure)
    console.error("[AUTH] Inbound API key not configured in .env");
    res.status(503).json({ message: "Inbound endpoint not configured" });
    return;
  }
  const provided = req.headers["x-internal-api-key"];
  console.log(`[AUTH] Provided key: ${provided}`);

  if (provided !== INBOUND_API_KEY) {
    console.warn(`[AUTH] Unauthorized inbound request. Provided: ${provided}, Expected: ${INBOUND_API_KEY}`);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
};

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/categories", categoriesRouter);
app.use("/subscriptions", subscriptionRouter);
app.use("/coupons", couponManagementRouter);
app.use("/search", searchRouter);
app.use("/inbounds", requireInboundKey, inboundRouter);  // 🔒 protected
app.use("/payments", paymentRouter);
app.use("/admin/payments", adminPaymentRouter);
app.use("/withdrawals", withdrawalRouter);

export { app as appV1 };


