import "../utils/subscriptionChecker";
import express from "express";
import { authRouter } from "../routes/v1/auth.routes";
import { availabilityRouter } from "../routes/v1/availability.routes";
import { categoriesRouter } from "../routes/v1/category.routes";
import { couponRouter } from "../routes/v1/coupon.routes";
import { searchRouter } from "../routes/v1/search.routes";
import { subscriptionRouter } from "../routes/v1/subscription.routes";
import { userRouter } from "../routes/v1/user.routes";
import path from "path";
import passport from "passport";
import session from "express-session";

const app = express.Router();

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/categories", categoriesRouter); // Assuming you have a route for academic background
app.use("/subscriptions", subscriptionRouter); // Assuming you have a route for subscriptions
app.use("/availabilities", availabilityRouter); // Assuming you have a route for availabilities
app.use("/coupons", couponRouter); // Assuming you have a route for coupons
app.use("/search", searchRouter);

export { app as appV1 };
