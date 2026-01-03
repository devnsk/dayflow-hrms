import { z } from "zod";
import { PASSWORD_REQUIREMENTS } from "../constants";

export const uuidSchema = z.string().uuid("Invalid ID format");

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(
    PASSWORD_REQUIREMENTS.MIN_LENGTH,
    `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`
  )
  .max(
    PASSWORD_REQUIREMENTS.MAX_LENGTH,
    `Password must be at most ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`
  )
  .refine(
    (val) => !PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE || /[A-Z]/.test(val),
    "Password must contain at least one uppercase letter"
  )
  .refine(
    (val) => !PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE || /[a-z]/.test(val),
    "Password must contain at least one lowercase letter"
  )
  .refine(
    (val) => !PASSWORD_REQUIREMENTS.REQUIRE_NUMBER || /\d/.test(val),
    "Password must contain at least one number"
  );

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid phone number")
  .optional()
  .or(z.literal(""));

export const dateSchema = z.coerce.date();

export const optionalDateSchema = z.coerce.date().optional().nullable();

export const positiveIntSchema = z.coerce.number().int().positive();

export const nonNegativeSchema = z.coerce.number().min(0);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const employeeIdParamSchema = z.object({
  employeeId: uuidSchema,
});

export const companyIdParamSchema = z.object({
  companyId: uuidSchema,
});

export const dateRangeSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Start date must be before or equal to end date",
  });

export const searchQuerySchema = z.object({
  search: z.string().optional(),
  ...paginationSchema.shape,
});

export const requiredString = z
  .string()
  .trim()
  .min(1, "This field is required");

export const optionalString = z.string().trim().optional().or(z.literal(""));

export const postalCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Invalid postal code")
  .optional();

export const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN number")
  .optional();

export const aadharSchema = z
  .string()
  .regex(/^\d{12}$/, "Invalid Aadhar number")
  .optional();

export const bankAccountSchema = z
  .string()
  .regex(/^\d{9,18}$/, "Invalid bank account number")
  .optional();

export const ifscSchema = z
  .string()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code")
  .optional();
