import "dotenv/config";

// ── Startup validation: fail fast if required secrets are missing ──────────
const required = ["JWT_SECRET"] as const;
for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`[CONFIG] Required environment variable "${key}" is not set. Refusing to start.`);
    }
}

const config = {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || "development",
    db: {
        type: (process.env.DB_TYPE || "postgres") as "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        username: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD, // No fallback — must be set via env
        database: process.env.DB_NAME || "user-service-db",
        ssl: process.env.DB_SSL === "true" || true,
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        password: process.env.REDIS_PASSWORD,
        cacheDuration: parseInt(process.env.REDIS_CACHE_DURATION || "60000", 10),
        enabled: process.env.REDIS_ENABLED === "true" || false,
    },
    jwt: {
        secret: process.env.JWT_SECRET!, // Validated above
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
    s3: {
        endpoint: process.env.S3_ENDPOINT,
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        bucketName: process.env.S3_BUCKET_NAME || "assets",
        region: process.env.S3_REGION || "auto",
        readUrl: process.env.S3_READ_URL,
    },
    grpc: {
        port: parseInt(process.env.GRPC_PORT || "50051", 10),
    },
    chatServiceUrl: process.env.CHAT_SERVICE_URL,
    apiKeys: {
        userService: process.env.USER_SERVICE_API_KEY,
        bookingService: process.env.BOOKING_SERVICE_API_KEY,
        paymentService: process.env.PAYMENT_SERVICE_API_KEY,
        notificationService: process.env.NOTIFICATION_SERVICE_API_KEY,
    },
};

export default config;
