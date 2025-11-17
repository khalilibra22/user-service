import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import { getLogger } from "./logger";

class ValidationMiddleware {
  static validate(schema: Schema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
          res.status(400).json({
            error: error.details.map((detail) => detail.message),
          });
          return;
        }
        next();
      } catch (err) {
        (req.log || getLogger()).error({ err }, 'Validation Middleware Error');
        res.status(500).json({ error: "Internal Server Error" });
      }
    };
  }

  static validateQuery(schema: Schema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const { error, value } = schema.validate(req.query, { abortEarly: false });
        if (error) {
          res.status(400).json({
            error: error.details.map((detail) => detail.message),
          });
          return;
        }
        req.query = value;
        next();
      } catch (err) {
        (req.log || getLogger()).error({ err }, 'Validation Middleware Error');
        res.status(500).json({ error: "Internal Server Error" });
      }
    };
  }
}

export { ValidationMiddleware };
