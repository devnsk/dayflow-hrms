import { z } from "zod";
import {
  emailSchema,
  phoneSchema,
  uuidSchema,
  requiredString,
  optionalString,
  postalCodeSchema,
  paginationSchema,
} from "../../shared/validators";

export const createCompanySchema = z.object({
  name: requiredString.min(2, "Company name must be at least 2 characters"),
  email: emailSchema,
  phone: phoneSchema,
  website: z.string().url().optional().or(z.literal("")),
  address: optionalString,
  city: optionalString,
  state: optionalString,
  country: z.string().default("India"),
  postalCode: postalCodeSchema,
  timezone: z.string().default("Asia/Kolkata"),
  currency: z.string().default("INR"),
  fiscalYearStart: z.number().int().min(1).max(12).default(4),
  workingDays: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
});

export const updateCompanySchema = createCompanySchema.partial();

export const createDepartmentSchema = z.object({
  name: requiredString,
  code: requiredString.toUpperCase(),
  description: optionalString,
  parentId: uuidSchema.optional(),
  headId: uuidSchema.optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const createDesignationSchema = z.object({
  title: requiredString,
  code: requiredString.toUpperCase(),
  level: z.number().int().min(1).default(1),
  description: optionalString,
});

export const updateDesignationSchema = createDesignationSchema.partial();

export const createLocationSchema = z.object({
  name: requiredString,
  code: requiredString.toUpperCase(),
  address: optionalString,
  city: optionalString,
  state: optionalString,
  country: z.string().default("India"),
  postalCode: postalCodeSchema,
  timezone: z.string().default("Asia/Kolkata"),
  isHeadquarters: z.boolean().default(false),
});

export const updateLocationSchema = createLocationSchema.partial();

export const createShiftSchema = z.object({
  name: requiredString,
  code: requiredString.toUpperCase(),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  breakDuration: z.number().int().min(0).default(60),
  graceMinutes: z.number().int().min(0).default(15),
  workingHours: z.number().min(0).default(8),
  isNightShift: z.boolean().default(false),
  isDefault: z.boolean().default(false),
});

export const updateShiftSchema = createShiftSchema.partial();

export const createHolidaySchema = z.object({
  name: requiredString,
  date: z.coerce.date(),
  type: z.enum(["PUBLIC", "OPTIONAL", "RESTRICTED"]).default("PUBLIC"),
  isOptional: z.boolean().default(false),
  description: optionalString,
});

export const updateHolidaySchema = createHolidaySchema.partial();

export const listQuerySchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

// Export types
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;
