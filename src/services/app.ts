import "../utils/subscriptionChecker";
import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { authRouter } from "../routes/auth.routes";
import { userRouter } from "../routes/user.routes";
import path from "path";
import { academicBackgroundRouter } from "../routes/academicBackground.routes";
import { subscriptionRouter } from "../routes/subscription.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

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
app.use("/academic-backgrounds", academicBackgroundRouter); // Assuming you have a route for academic background
app.use("/subscriptions", subscriptionRouter); // Assuming you have a route for subscriptions

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export default app;
