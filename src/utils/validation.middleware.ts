import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import { getLogger } from "./logger";

class ValidationMiddleware {
  static validate(schema: Schema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,  // remove fields not in schema (prevents mass-assignment)
        });
        if (error) {
          res.status(400).json({
            error: error.details.map((detail) => detail.message),
          });
          return;
        }
        req.body = value;  // replace body with sanitized value
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
        const { error, value } = schema.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
        });
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

