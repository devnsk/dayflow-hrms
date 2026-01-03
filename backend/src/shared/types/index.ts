import { Request } from "express";
import { UserRole, UserStatus } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: AuthUser;
  companyId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId?: string | null;
  employeeId?: string | null;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
  type: "access" | "refresh";
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  meta?: PaginationMeta;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

export interface EmployeeFilters {
  departmentId?: string;
  designationId?: string;
  locationId?: string;
  managerId?: string;
  status?: string;
  employmentType?: string;
  search?: string;
}

export interface AttendanceFilters {
  employeeId?: string;
  departmentId?: string;
  status?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
}

export interface LeaveFilters {
  employeeId?: string;
  leaveTypeId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PayrollFilters {
  month?: number;
  year?: number;
  status?: string;
  employeeId?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

export type EmailTemplate =
  | "invite"
  | "welcome"
  | "password-reset"
  | "email-verification"
  | "leave-request"
  | "leave-approved"
  | "leave-rejected"
  | "payroll-generated"
  | "policy-update"
  | "system-alert";

export interface InviteEmployeePayload {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId?: string;
  designationId?: string;
  managerId?: string;
}

export interface ExportOptions {
  format: "csv" | "pdf" | "xlsx";
  filters?: Record<string, unknown>;
  columns?: string[];
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveToday: number;
  pendingLeaveRequests: number;
  attendanceToday: {
    present: number;
    absent: number;
    late: number;
  };
  upcomingBirthdays: Array<{
    id: string;
    name: string;
    date: Date;
  }>;
  recentJoiners: Array<{
    id: string;
    name: string;
    department: string;
    joiningDate: Date;
  }>;
}
