import rateLimit from "express-rate-limit";
import { RATE_LIMIT, HTTP_STATUS, ERROR_MESSAGES } from "../constants";
import { ApiResponse } from "../types";

export const defaultRateLimiter = rateLimit({
  windowMs: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || String(RATE_LIMIT.WINDOW_MS),
    10
  ),
  max: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || String(RATE_LIMIT.MAX_REQUESTS),
    10
  ),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
  } as ApiResponse,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    const userId = (req as unknown as { user?: { id: string } })?.user?.id;
    return userId || req.ip || "unknown";
  },
});

export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again later.",
  } as ApiResponse,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  skipSuccessfulRequests: true, // Only count failed attempts
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many password reset attempts. Please try again in an hour.",
  } as ApiResponse,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

export const emailRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 emails per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many email requests. Please try again later.",
  } as ApiResponse,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

export const exportRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 exports per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many export requests. Please try again later.",
  } as ApiResponse,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});
