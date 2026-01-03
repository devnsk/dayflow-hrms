export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 100,
  COMPANY_ADMIN: 80,
  MANAGER: 50,
  EMPLOYEE: 10,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: "1d",
  REFRESH_TOKEN: "7d",
  RESET_TOKEN: "1h",
  INVITE_TOKEN: "7d",
  EMAIL_VERIFICATION: "24h",
} as const;

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false,
} as const;

export const EMPLOYEE_CODE_PREFIX = "EMP";

export const LEAVE_SETTINGS = {
  MAX_CONSECUTIVE_DAYS: 30,
  MIN_NOTICE_DAYS: 0,
  YEAR_START_MONTH: 4, // April (Financial year)
} as const;

export const ATTENDANCE_SETTINGS = {
  DEFAULT_WORK_HOURS: 8,
  DEFAULT_BREAK_MINUTES: 60,
  GRACE_PERIOD_MINUTES: 15,
  HALF_DAY_HOURS: 4,
} as const;

export const PAYROLL_SETTINGS = {
  PF_RATE: 0.12, // 12%
  ESI_RATE: 0.0325, // 3.25%
  PROFESSIONAL_TAX_LIMIT: 2500,
} as const;

export const DATE_FORMATS = {
  DISPLAY: "DD MMM YYYY",
  INPUT: "YYYY-MM-DD",
  DATETIME: "DD MMM YYYY HH:mm",
  TIME: "HH:mm",
  MONTH_YEAR: "MMM YYYY",
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  UNAUTHORIZED: "You are not authorized to access this resource",
  FORBIDDEN: "You do not have permission to perform this action",
  TOKEN_EXPIRED: "Your session has expired. Please login again",
  TOKEN_INVALID: "Invalid token",
  EMAIL_NOT_VERIFIED: "Please verify your email address",
  ACCOUNT_INACTIVE: "Your account is inactive. Please contact admin",
  ACCOUNT_SUSPENDED: "Your account has been suspended",

  USER_NOT_FOUND: "User not found",
  USER_EXISTS: "A user with this email already exists",
  INVALID_RESET_TOKEN: "Invalid or expired reset token",
  INVALID_INVITE_TOKEN: "Invalid or expired invite token",

  COMPANY_NOT_FOUND: "Company not found",
  COMPANY_EXISTS: "A company with this name already exists",

  EMPLOYEE_NOT_FOUND: "Employee not found",
  EMPLOYEE_CODE_EXISTS: "An employee with this code already exists",

  DEPARTMENT_NOT_FOUND: "Department not found",
  DEPARTMENT_HAS_EMPLOYEES: "Cannot delete department with active employees",

  ALREADY_CHECKED_IN: "You have already checked in today",
  NOT_CHECKED_IN: "You have not checked in yet",
  ALREADY_CHECKED_OUT: "You have already checked out today",

  LEAVE_NOT_FOUND: "Leave request not found",
  INSUFFICIENT_BALANCE: "Insufficient leave balance",
  LEAVE_OVERLAP: "Leave request overlaps with existing leave",
  LEAVE_ALREADY_PROCESSED: "Leave request has already been processed",

  PAYROLL_NOT_FOUND: "Payroll record not found",
  PAYROLL_ALREADY_EXISTS: "Payroll for this period already exists",
  PAYROLL_ALREADY_PROCESSED: "Payroll has already been processed",
  NO_SALARY_STRUCTURE: "No salary structure found for employee",

  RESOURCE_NOT_FOUND: "Requested resource not found",
  VALIDATION_ERROR: "Validation error",
  INTERNAL_ERROR: "An unexpected error occurred",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later",
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logged out successfully",
  PASSWORD_RESET_EMAIL: "Password reset email sent successfully",
  PASSWORD_UPDATED: "Password updated successfully",
  EMAIL_VERIFIED: "Email verified successfully",
  INVITE_SENT: "Invite sent successfully",

  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",

  CHECKED_IN: "Checked in successfully",
  CHECKED_OUT: "Checked out successfully",

  LEAVE_APPLIED: "Leave request submitted successfully",
  LEAVE_APPROVED: "Leave request approved",
  LEAVE_REJECTED: "Leave request rejected",
  LEAVE_CANCELLED: "Leave request cancelled",

  PAYROLL_GENERATED: "Payroll generated successfully",
  PAYROLL_PROCESSED: "Payroll processed successfully",
} as const;

export const API_VERSION = {
  V1: "v1",
} as const;

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  AUTH_MAX_REQUESTS: 10,
} as const;
