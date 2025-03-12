import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

class ValidationMiddleware {
  schema: Schema;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  validate(): (req: Request, res: Response, next: NextFunction) => void {
    try {
      return (req: Request, res: Response, next: NextFunction) => {
        const { error } = this.schema.validate(req.body);
        if (error) {
          return res
            .status(400)
            .json({ error: error.details.map((detail) => detail.message) });
        }
        next();
      };
    } catch (error) {
      return (req: Request, res: Response, next: NextFunction) => {
        res.status(500).json({ error: "Internal Server Error" });
      };
    }
  }
}

export { ValidationMiddleware };
