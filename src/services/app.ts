import "../utils/subscriptionChecker";
import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { authRouter } from "../routes/auth.routes";
import { userRouter } from "../routes/user.routes";
import path from "path";
import { categoriesRouter } from "../routes/category.routes";
import { subscriptionRouter } from "../routes/subscription.routes";
import session from "express-session";
import passport from "passport";
import "../config/passport";
import { availabilityRouter } from "../routes/availability.routes";
import { couponRouter } from "../routes/coupon.routes";
import { searchRouter } from "../routes/search.routes";
import GrpcServer from "../grpc";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(cors());

app.use(express.json());

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof SyntaxError && err.name === "SyntaxError") {
    // JSON parsing error
    res.status(400).json({ error: "Invalid JSON" });
  }
  next(err); // Forward the error if it's not a JSON parsing error
});
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/categories", categoriesRouter); // Assuming you have a route for academic background
app.use("/subscriptions", subscriptionRouter); // Assuming you have a route for subscriptions
app.use("/availabilities", availabilityRouter); // Assuming you have a route for availabilities
app.use("/coupons", couponRouter); // Assuming you have a route for coupons

app.use("/search", searchRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Running...");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  new GrpcServer().start();
});

export default app;
