import { z } from "zod";
import { LeaveStatus, LeaveType } from "@prisma/client";
import {
  uuidSchema,
  dateSchema,
  paginationSchema,
  requiredString,
  optionalString,
} from "../../shared/validators";

export const createLeaveTypeSchema = z.object({
  name: requiredString,
  code: requiredString.toUpperCase(),
  type: z.nativeEnum(LeaveType).default(LeaveType.CUSTOM),
  description: optionalString,
  defaultBalance: z.number().min(0).default(0),
  maxBalance: z.number().min(0).optional(),
  carryForwardLimit: z.number().min(0).optional(),
  encashmentAllowed: z.boolean().default(false),
  allowHalfDay: z.boolean().default(true),
  allowNegativeBalance: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
  minDaysNotice: z.number().int().min(0).default(0),
  maxConsecutiveDays: z.number().int().min(1).optional(),
  isPaid: z.boolean().default(true),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();

export const applyLeaveSchema = z
  .object({
    leaveTypeId: uuidSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    isHalfDay: z.boolean().default(false),
    halfDayType: z.enum(["FIRST_HALF", "SECOND_HALF"]).optional(),
    reason: requiredString.min(10, "Please provide a detailed reason"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Start date must be before or equal to end date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      if (data.isHalfDay) {
        return data.startDate.toDateString() === data.endDate.toDateString();
      }
      return true;
    },
    {
      message: "Half day leave must be for a single day",
      path: ["isHalfDay"],
    }
  )
  .refine(
    (data) => {
      if (data.isHalfDay && !data.halfDayType) {
        return false;
      }
      return true;
    },
    {
      message: "Half day type is required for half day leave",
      path: ["halfDayType"],
    }
  );

export const leaveActionSchema = z.object({
  status: z.enum([LeaveStatus.APPROVED, LeaveStatus.REJECTED]),
  comments: optionalString,
});

export const cancelLeaveSchema = z.object({
  reason: requiredString.min(5, "Please provide a reason for cancellation"),
});

export const adjustBalanceSchema = z.object({
  leaveTypeId: uuidSchema,
  adjustment: z.number(),
  reason: requiredString,
});

export const leaveListQuerySchema = z.object({
  ...paginationSchema.shape,
  employeeId: uuidSchema.optional(),
  leaveTypeId: uuidSchema.optional(),
  status: z.nativeEnum(LeaveStatus).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export const leaveBalanceQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

// Export types
export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;
export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;
export type LeaveActionInput = z.infer<typeof leaveActionSchema>;
export type CancelLeaveInput = z.infer<typeof cancelLeaveSchema>;
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;
