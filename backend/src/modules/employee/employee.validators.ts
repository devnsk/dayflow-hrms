import { z } from "zod";
import { EmploymentType, EmployeeStatus } from "@prisma/client";
import {
  emailSchema,
  phoneSchema,
  uuidSchema,
  requiredString,
  optionalString,
  dateSchema,
  optionalDateSchema,
  panSchema,
  aadharSchema,
  bankAccountSchema,
  ifscSchema,
  paginationSchema,
} from "../../shared/validators";

export const createEmployeeSchema = z.object({
  firstName: requiredString.min(2),
  lastName: requiredString.min(2),
  email: emailSchema,
  phone: phoneSchema,
  personalEmail: emailSchema.optional().or(z.literal("")),
  dateOfBirth: optionalDateSchema,
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  maritalStatus: z
    .enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"])
    .optional(),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional(),
  nationality: z.string().default("Indian"),

  currentAddress: optionalString,
  permanentAddress: optionalString,

  emergencyName: optionalString,
  emergencyPhone: phoneSchema,
  emergencyRelation: optionalString,

  employmentType: z
    .nativeEnum(EmploymentType)
    .default(EmploymentType.FULL_TIME),
  joiningDate: dateSchema,
  confirmationDate: optionalDateSchema,
  probationEndDate: optionalDateSchema,
  departmentId: uuidSchema.optional(),
  designationId: uuidSchema.optional(),
  locationId: uuidSchema.optional(),
  managerId: uuidSchema.optional(),
  shiftId: uuidSchema.optional(),

  bankName: optionalString,
  bankAccountNo: bankAccountSchema,
  bankIfscCode: ifscSchema,
  panNumber: panSchema,
  aadharNumber: aadharSchema,
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const updateEmployeeStatusSchema = z.object({
  status: z.nativeEnum(EmployeeStatus),
  resignationDate: optionalDateSchema,
  lastWorkingDate: optionalDateSchema,
  exitReason: optionalString,
});

export const createSalaryStructureSchema = z.object({
  basicSalary: z.number().positive(),
  hra: z.number().min(0).default(0),
  da: z.number().min(0).default(0),
  ta: z.number().min(0).default(0),
  specialAllowance: z.number().min(0).default(0),
  medicalAllowance: z.number().min(0).default(0),
  otherAllowances: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number(),
      })
    )
    .optional(),
  pf: z.number().min(0).default(0),
  esi: z.number().min(0).default(0),
  professionalTax: z.number().min(0).default(0),
  tds: z.number().min(0).default(0),
  otherDeductions: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number(),
      })
    )
    .optional(),
  effectiveFrom: dateSchema,
});

export const employeeListQuerySchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  departmentId: uuidSchema.optional(),
  designationId: uuidSchema.optional(),
  locationId: uuidSchema.optional(),
  managerId: uuidSchema.optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type UpdateEmployeeStatusInput = z.infer<
  typeof updateEmployeeStatusSchema
>;
export type CreateSalaryStructureInput = z.infer<
  typeof createSalaryStructureSchema
>;
