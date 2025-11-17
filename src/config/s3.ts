import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getLogger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

const logger = getLogger();

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
  region: process.env.S3_REGION || "auto",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "assets";

export interface S3UploadResult {
  key: string;
  url: string;
}

/**
 * Upload a file buffer to S3
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The name/key for the file in S3
 * @param mimeType - The MIME type of the file
 * @returns Promise with the S3 key and URL
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<S3UploadResult> {
  try {
    //const key = `uploads/${Date.now()}-${fileName}`;
    const key = `${uuidv4()}-${fileName
        .toLowerCase()
        .replace(/\s+/g, "-")}`;

    logger.info({ 
      bucket: BUCKET_NAME, 
      key, 
      fileName,
      hasCredentials: !!(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY),
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT
    }, "Attempting S3 upload");

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // Construct the URL (adjust based on your S3 configuration)
    const url = `${process.env.S3_READ_URL}/${key}`;

    logger.info({ key, url }, "File uploaded to S3 successfully");

    return { key, url };
  } catch (error: any) {
    logger.error({ 
      err: error, 
      fileName,
      errorMessage: error?.message,
      errorCode: error?.Code || error?.code,
      errorName: error?.name,
      bucket: BUCKET_NAME,
      region: process.env.S3_REGION
    }, "Failed to upload file to S3");
    throw error; // Re-throw the original error instead of creating a new one
  }
}

export { s3Client };

