import "../utils/subscription-checker";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { appV1 } from "./app-v1";

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

app.use("/v1", appV1);

app.get("/", (req: Request, res: Response) => {
  res.send("Running...");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  //new GrpcServer().start();
});

export default app;
