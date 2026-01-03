import { z } from "zod";
import { UserRole } from "@prisma/client";
import {
  emailSchema,
  passwordSchema,
  uuidSchema,
  requiredString,
} from "../../shared/validators";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const companySignupSchema = z
  .object({
    companyName: requiredString.min(
      2,
      "Company name must be at least 2 characters"
    ),
    companyEmail: emailSchema,
    companyPhone: z.string().optional(),
    firstName: requiredString.min(
      2,
      "First name must be at least 2 characters"
    ),
    lastName: requiredString.min(2, "Last name must be at least 2 characters"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: requiredString,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export const verifyEmailSchema = z.object({
  token: requiredString,
});

export const inviteEmployeeSchema = z.object({
  email: emailSchema,
  firstName: requiredString.min(2, "First name must be at least 2 characters"),
  lastName: requiredString.min(2, "Last name must be at least 2 characters"),
  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE),
  departmentId: uuidSchema.optional(),
  designationId: uuidSchema.optional(),
  managerId: uuidSchema.optional(),
});

export const acceptInviteSchema = z
  .object({
    token: requiredString,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const refreshTokenSchema = z.object({
  refreshToken: requiredString,
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type CompanySignupInput = z.infer<typeof companySignupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type InviteEmployeeInput = z.infer<typeof inviteEmployeeSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
