import { Request, Response, NextFunction } from "express";
import { UserRole } from "../enums/userRoles.enum";
import { getLogger } from "../utils/logger";

const logger = getLogger();

/**
 * Middleware to validate file uploads before S3 upload
 * Validates that required files are present based on user role
 */
export const validateFileUploads = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { role } = req.body;

    // Students should not upload files
    if (role === UserRole.STUDENT) {
      if (req.files && Object.keys(req.files).length > 0) {
        res.status(400).json({ 
          error: "Students are not allowed to upload profile pictures or certificates" 
        });
        return;
      }
      return next();
    }

    // For teachers and academies, files are optional but if provided, validate them
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validate profilePicture if present
      if (files.profilePicture && files.profilePicture[0]) {
        const file = files.profilePicture[0];
        const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        
        if (!allowedMimeTypes.includes(file.mimetype)) {
          res.status(400).json({ 
            error: "Profile picture must be an image (jpeg, jpg, png, gif, or webp)" 
          });
          return;
        }
      }

      // Validate certificate if present
      if (files.certificate && files.certificate[0]) {
        const file = files.certificate[0];
        const allowedMimeTypes = [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
        ];
        
        if (!allowedMimeTypes.includes(file.mimetype)) {
          res.status(400).json({ 
            error: "Certificate must be a PDF or image (jpeg, jpg, png)" 
          });
          return;
        }
      }
    }

    next();
  } catch (error) {
    logger.error({ err: error }, "Error validating file uploads");
    res.status(500).json({ error: "Error validating file uploads" });
  }
};

