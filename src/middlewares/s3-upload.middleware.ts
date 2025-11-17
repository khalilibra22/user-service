import { Request, Response, NextFunction } from "express";
import { uploadToS3 } from "../config/s3";
import { getLogger } from "../utils/logger";
import { ImageService } from "../services/image.service";

const logger = getLogger();

/**
 * Middleware to upload files from memory to S3
 * Optimizes images before upload, bypasses non-image files
 * Expects files to be in req.files from multer memory storage
 */
export const s3UploadMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.files) {
      // No files uploaded, continue to next middleware
      return next();
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Upload profilePicture if present
    if (files.profilePicture && files.profilePicture[0]) {
      let file = files.profilePicture[0];
      
      // Optimize image if it's an image file
      if (file.mimetype.startsWith("image/")) {
        try {
          file = await ImageService.reduceImageResolution(file);
          logger.info({ filename: file.originalname }, "Profile picture optimized");
        } catch (error) {
          logger.warn({ err: error }, "Failed to optimize profile picture, using original");
        }
      }
      
      const result = await uploadToS3(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      req.body.profilePicture = result.url;
      logger.info({ url: result.url }, "Profile picture uploaded to S3");
    }

    // Upload certificate if present
    if (files.certificate && files.certificate[0]) {
      let file = files.certificate[0];
      
      // Optimize image if it's an image file (PDFs bypass optimization)
      if (file.mimetype.startsWith("image/")) {
        try {
          file = await ImageService.reduceImageResolution(file);
          logger.info({ filename: file.originalname }, "Certificate image optimized");
        } catch (error) {
          logger.warn({ err: error }, "Failed to optimize certificate, using original");
        }
      }
      
      const result = await uploadToS3(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      req.body.certificate = result.url;
      logger.info({ url: result.url }, "Certificate uploaded to S3");
    }

    next();
  } catch (error) {
    logger.error({ err: error }, "Error uploading files to S3");
    res.status(500).json({ error: "Failed to upload files" });
  }
};

