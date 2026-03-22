import { injectable } from "tsyringe";
import sharp from "sharp";
import { getLogger } from "../utils/logger";

const logger = getLogger();

@injectable()
export class ImageService {
  /**
   * Reduce image resolution and compress to optimize file size
   * @param file - Multer file object with buffer
   * @returns Optimized file object with reduced buffer
   */
  static async reduceImageResolution(
    file: Express.Multer.File
  ): Promise<Express.Multer.File> {
    if (!file.mimetype.startsWith("image/")) {
      throw new Error("File is not an image");
    }

    try {
      // Get image metadata to check current dimensions
      const metadata = await sharp(file.buffer).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        throw new Error("Could not read image dimensions");
      }

      // Define maximum dimensions (you can adjust these values)
      const maxWidth = 1920; // Full HD width
      const maxHeight = 1080; // Full HD height
      const quality = 80; // JPEG quality (0-100)

      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = width;
      let newHeight = height;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          // Landscape image
          newWidth = Math.min(width, maxWidth);
          newHeight = Math.round(newWidth / aspectRatio);

          // If height is still too large, adjust again
          if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = Math.round(newHeight * aspectRatio);
          }
        } else {
          // Portrait or square image
          newHeight = Math.min(height, maxHeight);
          newWidth = Math.round(newHeight * aspectRatio);

          // If width is still too large, adjust again
          if (newWidth > maxWidth) {
            newWidth = maxWidth;
            newHeight = Math.round(newWidth / aspectRatio);
          }
        }
      }

      // Only process if dimensions need to be reduced or if it's not already JPEG
      const needsProcessing =
        newWidth < width ||
        newHeight < height ||
        !file.mimetype.includes("jpeg");

      if (!needsProcessing) {
        // Return original file if no processing needed
        logger.info(
          { filename: file.originalname, width, height },
          "Image already optimized, skipping processing"
        );
        return file;
      }

      // Process the image with Sharp
      const processedBuffer = await sharp(file.buffer)
        .resize(newWidth, newHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality: quality,
          progressive: true,
          mozjpeg: true, // Use mozjpeg encoder for better compression
        })
        .toBuffer();

      // Check if processed size is actually smaller, otherwise use original
      const finalBuffer =
        processedBuffer.length < file.buffer.length
          ? processedBuffer
          : file.buffer;

      const originalSize = file.size;
      const newSize = finalBuffer.length;
      const reduction = ((1 - newSize / originalSize) * 100).toFixed(2);

      logger.info(
        {
          filename: file.originalname,
          originalSize,
          newSize,
          reduction: `${reduction}%`,
          originalDimensions: `${width}x${height}`,
          newDimensions: `${newWidth}x${newHeight}`,
        },
        "Image optimized successfully"
      );

      return {
        ...file,
        buffer: finalBuffer,
        size: finalBuffer.length,
        mimetype: "image/jpeg", // Always convert to JPEG for consistency
      };
    } catch (error) {
      logger.error({ err: error }, "reduceImageResolution failed");
      throw new Error(`Failed to reduce image resolution: ${error}`);
    }
  }
}

