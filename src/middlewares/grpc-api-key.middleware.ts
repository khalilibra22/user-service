import * as grpc from "@grpc/grpc-js";
import { getLogger } from "../utils/logger";

const logger = getLogger();

// ── Startup check: warn if any API keys are missing ──────────────────────
const API_KEY_ENV_VARS = [
  "USER_SERVICE_API_KEY",
  "BOOKING_SERVICE_API_KEY",
  "PAYMENT_SERVICE_API_KEY",
  "NOTIFICATION_SERVICE_API_KEY",
];
for (const key of API_KEY_ENV_VARS) {
  if (!process.env[key]) {
    logger.warn(`[GrpcApiKeyMiddleware] Environment variable "${key}" is not set — that service cannot authenticate.`);
  }
}

export class GrpcApiKeyMiddleware {
  private static readonly API_KEYS = new Set<string>(
    API_KEY_ENV_VARS.map((k) => process.env[k]).filter(Boolean) as string[]
  );

  /**
   * Validate API key from gRPC metadata
   */
  static validateApiKey(call: grpc.ServerUnaryCall<any, any>): boolean {
    try {
      const metadata = call.metadata;
      const apiKey = metadata.get("x-api-key")[0] as string;

      if (!apiKey) {
        logger.warn("gRPC call without API key from:");
        return false;
      }

      const isValid = this.API_KEYS.has(apiKey);
      if (!isValid) {
        logger.warn("gRPC call with invalid API key from:");
      }

      return isValid;
    } catch (error: any) {
      logger.error("Error validating API key:", error);
      return false;
    }
  }

  /**
   * Simple API key wrapper for gRPC methods
   */
  static withApiKey<T extends grpc.ServerUnaryCall<any, any>>(
    handler: (call: T, callback: grpc.sendUnaryData<any>) => Promise<void>
  ) {
    return async (call: T, callback: grpc.sendUnaryData<any>) => {
      if (!this.validateApiKey(call)) {
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          message: "Invalid or missing API key",
        });
      }

      try {
        await handler(call, callback);
      } catch (error: any) {
        logger.error("Error in secured gRPC handler:", error);
        callback({
          code: grpc.status.INTERNAL,
          message: error.message || "Internal server error",
        });
      }
    };
  }

  /**
   * Get count of configured API keys (safe for diagnostics)
   */
  static getConfiguredKeysCount(): number {
    return this.API_KEYS.size;
  }

  /**
   * Add a new API key at runtime (private — only for internal use)
   */
  private static addApiKey(key: string): void {
    this.API_KEYS.add(key);
    logger.info("Added new API key for service authentication");
  }

  /**
   * Remove an API key (private — only for internal use)
   */
  private static removeApiKey(key: string): boolean {
    const removed = this.API_KEYS.delete(key);
    if (removed) {
      logger.info("Removed API key from service authentication");
    }
    return removed;
  }
}

