// Authentication & Authorization
export {
  authenticate,
  optionalAuth,
  requireEmailVerified,
  requireRoles,
  requireSuperAdmin,
  requireCompanyAdmin,
  requireManager,
  requireSameCompany,
  requireSelfOrManager,
} from "./auth.middleware";

// Error Handling
export {
  notFoundHandler,
  errorHandler,
  asyncHandler,
} from "./error.middleware";

// Validation
export {
  validate,
  validateBody,
  validateQuery,
  validateParams,
} from "./validate.middleware";

// Rate Limiting
export {
  defaultRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  emailRateLimiter,
  exportRateLimiter,
} from "./rateLimit.middleware";

// Audit Logging
export { createAuditLog, audit, auditAction } from "./audit.middleware";
