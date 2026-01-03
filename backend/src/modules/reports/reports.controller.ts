import { Response } from "express";
import { AuthRequest } from "../../shared/types";
import { reportsService } from "./reports.service";
import { sendSuccess } from "../../shared/utils/response";
import { auditAction } from "../../shared/middleware";

class ReportsController {
  async getDashboard(req: AuthRequest, res: Response): Promise<Response> {
    const stats = await reportsService.getDashboardStats(req.user!.companyId!);
    return sendSuccess(res, stats);
  }

  async getAttendanceReport(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const { startDate, endDate, departmentId } = req.query as {
      startDate: string;
      endDate: string;
      departmentId?: string;
    };

    const report = await reportsService.getAttendanceReport(
      req.user!.companyId!,
      new Date(startDate),
      new Date(endDate),
      departmentId
    );

    await auditAction.export(req, "attendance_report", {
      startDate,
      endDate,
      departmentId,
    });

    return sendSuccess(res, report);
  }

  async getLeaveReport(req: AuthRequest, res: Response): Promise<Response> {
    const { startDate, endDate, departmentId } = req.query as {
      startDate: string;
      endDate: string;
      departmentId?: string;
    };

    const report = await reportsService.getLeaveReport(
      req.user!.companyId!,
      new Date(startDate),
      new Date(endDate),
      departmentId
    );

    await auditAction.export(req, "leave_report", {
      startDate,
      endDate,
      departmentId,
    });

    return sendSuccess(res, report);
  }

  async getPayrollReport(req: AuthRequest, res: Response): Promise<Response> {
    const { month, year } = req.query as { month: string; year: string };

    const report = await reportsService.getPayrollReport(
      req.user!.companyId!,
      parseInt(month, 10),
      parseInt(year, 10)
    );

    await auditAction.export(req, "payroll_report", { month, year });

    return sendSuccess(res, report);
  }

  async getEmployeeLifecycleReport(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };

    const report = await reportsService.getEmployeeLifecycleReport(
      req.user!.companyId!,
      new Date(startDate),
      new Date(endDate)
    );

    await auditAction.export(req, "employee_lifecycle_report", {
      startDate,
      endDate,
    });

    return sendSuccess(res, report);
  }
}

export const reportsController = new ReportsController();
