import { startSubscriptionCleanupCron } from "../background/subscription-cleanup.cron";
import { releaseFrozenEarningsTask } from "../background/earning-cleanup.cron";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { appV1 } from "./app-v1";
import { requestLogger } from "../utils/request-logger.middleware";
import { getLogger } from "../utils/logger";
import config from "../config";

const app = express();
const port = config.port;
const isProduction = config.env === "production";

// ── CORS — restrict to configured origins ────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: isProduction
      ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
      : true, // permissive in development
    credentials: true,
  })
);

app.use(express.json());

app.use(requestLogger);

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof SyntaxError && err.name === "SyntaxError") {
    res.status(400).json({ error: "Invalid JSON" });
  }
  next(err);
});

app.use("/v1", appV1);

app.get("/", (req: Request, res: Response) => {
  res.send("Running...");
});

// ── Global error handler — sanitize messages in production ───────────────
app.use((err: any, req: Request, res: Response, _next: NextFunction): void => {
  const log = req.log || getLogger();
  log.error({ err }, "Unhandled error");

  if (req.reqId && !res.getHeader("X-Request-Id")) {
    res.setHeader("X-Request-Id", req.reqId);
  }

  const status = err.status || 500;
  // Never leak internal error details to clients in production
  const message =
    isProduction && status === 500 ? "Internal Server Error" : err.message || "Internal Server Error";

  res.status(status).json({ error: message });
});

app.listen(port, () => {
  const logger = getLogger();
  logger.info(`Server running on http://localhost:${port}`);
  startSubscriptionCleanupCron();
  releaseFrozenEarningsTask.start();
});

export default app;

