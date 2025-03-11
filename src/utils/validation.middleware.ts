import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

class ValidationMiddleware {
  schema: Schema;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  validate(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error } = this.schema.validate(req.body);
      if (error) {
        return res
          .status(400)
          .json({ error: error.details.map((detail) => detail.message) });
      }
      next();
    };
  }
}

export { ValidationMiddleware };
