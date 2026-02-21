import rateLimit from "express-rate-limit";

/**
 * Rate limiter for login endpoint.
 * 10 attempts per 15 minutes per IP.
 */
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

/**
 * Rate limiter for password reset / forgot-password endpoint.
 * 5 attempts per 15 minutes per IP.
 */
export const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many password reset requests. Please try again in 15 minutes." },
});
