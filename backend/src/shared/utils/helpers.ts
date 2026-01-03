import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { EMPLOYEE_CODE_PREFIX, PAGINATION } from "../constants";
import { PaginationParams } from "../types";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate an employee code
 */
export function generateEmployeeCode(sequence: number): string {
  return `${EMPLOYEE_CODE_PREFIX}${String(sequence).padStart(5, "0")}`;
}

/**
 * Generate a company slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Parse pagination params from query
 */
export function parsePaginationParams(
  query: Record<string, unknown>
): PaginationParams {
  const page = Math.max(
    1,
    parseInt(String(query.page || PAGINATION.DEFAULT_PAGE), 10)
  );
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit || PAGINATION.DEFAULT_LIMIT), 10))
  );
  const sortBy = String(query.sortBy || "createdAt");
  const sortOrder = String(query.sortOrder || "desc").toLowerCase() as
    | "asc"
    | "desc";

  return { page, limit, sortBy, sortOrder };
}

/**
 * Calculate offset for pagination
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string,
  format: string = "DD MMM YYYY"
): string {
  return dayjs(date).format(format);
}

/**
 * Format datetime for display
 */
export function formatDateTime(
  date: Date | string,
  format: string = "DD MMM YYYY HH:mm"
): string {
  return dayjs(date).format(format);
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string = new Date()): Date {
  return dayjs(date).startOf("day").toDate();
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string = new Date()): Date {
  return dayjs(date).endOf("day").toDate();
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date | string = new Date()): Date {
  return dayjs(date).startOf("month").toDate();
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date | string = new Date()): Date {
  return dayjs(date).endOf("month").toDate();
}

/**
 * Calculate difference between two dates in days
 */
export function daysBetween(
  startDate: Date | string,
  endDate: Date | string
): number {
  return dayjs(endDate).diff(dayjs(startDate), "day") + 1; // Inclusive
}

/**
 * Calculate work hours from check-in and check-out times
 */
export function calculateWorkHours(
  checkIn: Date,
  checkOut: Date,
  breakMinutes: number = 0
): number {
  const totalMinutes = dayjs(checkOut).diff(dayjs(checkIn), "minute");
  const workMinutes = Math.max(0, totalMinutes - breakMinutes);
  return Math.round((workMinutes / 60) * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date | string): boolean {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  return dayjs(date).isSame(dayjs(), "day");
}

/**
 * Get working days count between two dates
 */
export function getWorkingDaysCount(
  startDate: Date | string,
  endDate: Date | string,
  workingDays: number[] = [1, 2, 3, 4, 5] // Monday to Friday
): number {
  let count = 0;
  let current = dayjs(startDate);
  const end = dayjs(endDate);

  while (current.isSame(end, "day") || current.isBefore(end, "day")) {
    if (workingDays.includes(current.day())) {
      count++;
    }
    current = current.add(1, "day");
  }

  return count;
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes to HH:mm string
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

/**
 * Pick specified keys from an object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
}

/**
 * Omit specified keys from an object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

/**
 * Check if value is empty (null, undefined, empty string, or empty array)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get full name from first and last name
 */
export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Mask sensitive data (email, phone, etc.)
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return `${phone.slice(0, 2)}****${phone.slice(-2)}`;
}
