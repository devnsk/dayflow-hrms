import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";
import {
  uuidSchema,
  dateSchema,
  paginationSchema,
} from "../../shared/validators";

export const checkInSchema = z.object({
  notes: z.string().optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().optional(),
});

export const manualAttendanceSchema = z.object({
  employeeId: uuidSchema,
  date: dateSchema,
  checkIn: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  checkOut: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)")
    .optional(),
  status: z.nativeEnum(AttendanceStatus).default(AttendanceStatus.PRESENT),
  notes: z.string().optional(),
});

export const correctionRequestSchema = z.object({
  date: dateSchema,
  checkIn: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  checkOut: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)")
    .optional(),
  reason: z.string().min(10, "Please provide a detailed reason"),
});

export const correctionActionSchema = z.object({
  approved: z.boolean(),
  comments: z.string().optional(),
});

export const attendanceListQuerySchema = z.object({
  ...paginationSchema.shape,
  employeeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  date: dateSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export const monthlySummaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  employeeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
});

// Export types
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;
export type CorrectionRequestInput = z.infer<typeof correctionRequestSchema>;
export type CorrectionActionInput = z.infer<typeof correctionActionSchema>;
