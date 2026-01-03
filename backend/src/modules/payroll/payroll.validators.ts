import { z } from "zod";
import { PayrollStatus } from "@prisma/client";
import {
  uuidSchema,
  paginationSchema,
  optionalString,
} from "../../shared/validators";

export const generatePayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  notes: optionalString,
});

export const updatePayrollItemSchema = z.object({
  overtimePay: z.number().min(0).optional(),
  bonus: z.number().min(0).optional(),
  otherEarnings: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number(),
      })
    )
    .optional(),
  otherDeductions: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number(),
      })
    )
    .optional(),
});

export const processPayrollSchema = z.object({
  notes: optionalString,
});

export const markPaidSchema = z.object({
  paidAt: z.coerce.date().optional(),
});

export const payrollListQuerySchema = z.object({
  ...paginationSchema.shape,
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  status: z.nativeEnum(PayrollStatus).optional(),
});

export const payrollItemsQuerySchema = z.object({
  ...paginationSchema.shape,
  employeeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
});

// Export types
export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>;
export type UpdatePayrollItemInput = z.infer<typeof updatePayrollItemSchema>;
export type ProcessPayrollInput = z.infer<typeof processPayrollSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
