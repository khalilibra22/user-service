import * as grpc from '@grpc/grpc-js';

export class GrpcApiKeyMiddleware {
  private static readonly API_KEYS = new Set([
    process.env.USER_SERVICE_API_KEY || 'user-service-key-123',
    process.env.BOOKING_SERVICE_API_KEY || 'booking-service-key-456',
    process.env.PAYMENT_SERVICE_API_KEY || 'payment-service-key-789',
    process.env.NOTIFICATION_SERVICE_API_KEY || 'notification-service-key-101',
    // Add more service keys as needed
  ]);

  /**
   * Validate API key from gRPC metadata
   */
  static validateApiKey(call: grpc.ServerUnaryCall<any, any>): boolean {
    try {
      const metadata = call.metadata;
      const apiKey = metadata.get('x-api-key')[0] as string;
      
      if (!apiKey) {
        console.warn('gRPC call without API key from:', call.getPeer());
        return false;
      }

      const isValid = this.API_KEYS.has(apiKey);
      if (!isValid) {
        console.warn('gRPC call with invalid API key from:', call.getPeer());
      }
      
      return isValid;
    } catch (error) {
      console.error('Error validating API key:', error);
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
          message: 'Invalid or missing API key'
        });
      }
      
      try {
        await handler(call, callback);
      } catch (error: any) {
        console.error('Error in secured gRPC handler:', error);
        callback({
          code: grpc.status.INTERNAL,
          message: error.message || 'Internal server error'
        });
      }
    };
  }

  /**
   * Get list of configured API keys (for debugging - don't expose in production)
   */
  static getConfiguredKeysCount(): number {
    return this.API_KEYS.size;
  }

  /**
   * Add a new API key at runtime (useful for dynamic service registration)
   */
  static addApiKey(key: string): void {
    this.API_KEYS.add(key);
    console.log('Added new API key for service authentication');
  }

  /**
   * Remove an API key (useful for key rotation)
   */
  static removeApiKey(key: string): boolean {
    const removed = this.API_KEYS.delete(key);
    if (removed) {
      console.log('Removed API key from service authentication');
    }
    return removed;
  }
}
