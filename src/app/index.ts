import "../utils/subscription-checker";
import { startSubscriptionCleanupCron } from "../background/subscription-cleanup.cron";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { appV1 } from "./app-v1";
import { requestLogger } from "../utils/request-logger.middleware";
import { getLogger } from "../utils/logger";
import config from "../config";

const app = express();
const port = config.port;

app.use(cors());

app.use(express.json());

app.use(requestLogger);

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof SyntaxError && err.name === "SyntaxError") {
    // JSON parsing error
    res.status(400).json({ error: "Invalid JSON" });
  }
  next(err); // Forward the error if it's not a JSON parsing error
});

app.use("/v1", appV1);

app.get("/", (req: Request, res: Response) => {
  res.send("Running...");
});

// Global error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction): void => {
  const log = req.log || getLogger();
  log.error({ err }, 'Unhandled error');

  // Ensure X-Request-Id is present in error response
  if (req.reqId && !res.getHeader('X-Request-Id')) {
    res.setHeader('X-Request-Id', req.reqId);
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(port, () => {
  const logger = getLogger();
  logger.info(`Server running on http://localhost:${port}`);
  startSubscriptionCleanupCron();
  //new GrpcServer().start();
});

export default app;
