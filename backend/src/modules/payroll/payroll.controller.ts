import { Response } from "express";
import { AuthRequest } from "../../shared/types";
import { payrollService } from "./payroll.service";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
} from "../../shared/utils/response";
import { SUCCESS_MESSAGES } from "../../shared/constants";
import { parsePaginationParams } from "../../shared/utils/helpers";
import { auditAction } from "../../shared/middleware";

class PayrollController {
  async generatePayroll(req: AuthRequest, res: Response): Promise<Response> {
    const payroll = await payrollService.generatePayroll(
      req.user!.companyId!,
      req.user!.id,
      req.body
    );
    await auditAction.create(req, "payroll_runs", payroll.id, req.body);
    return sendCreated(res, payroll, SUCCESS_MESSAGES.PAYROLL_GENERATED);
  }

  async listPayrollRuns(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const filters = {
      month: req.query.month
        ? parseInt(req.query.month as string, 10)
        : undefined,
      year: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
      status: req.query.status as string | undefined,
    };

    const { runs, total } = await payrollService.listPayrollRuns(
      req.user!.companyId!,
      pagination,
      filters
    );

    return sendPaginated(res, runs, total, pagination.page, pagination.limit);
  }

  async getPayrollRun(req: AuthRequest, res: Response): Promise<Response> {
    const run = await payrollService.getPayrollRun(
      req.user!.companyId!,
      req.params.id
    );
    return sendSuccess(res, run);
  }

  async getPayrollItems(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const filters = {
      employeeId: req.query.employeeId as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
    };

    const { items, total } = await payrollService.getPayrollItems(
      req.user!.companyId!,
      req.params.id,
      pagination,
      filters
    );

    return sendPaginated(res, items, total, pagination.page, pagination.limit);
  }

  async updatePayrollItem(req: AuthRequest, res: Response): Promise<Response> {
    const item = await payrollService.updatePayrollItem(
      req.user!.companyId!,
      req.params.id,
      req.body
    );
    await auditAction.update(
      req,
      "payroll_items",
      item.id,
      undefined,
      req.body
    );
    return sendSuccess(res, item, SUCCESS_MESSAGES.UPDATED);
  }

  async processPayroll(req: AuthRequest, res: Response): Promise<Response> {
    const run = await payrollService.processPayroll(
      req.user!.companyId!,
      req.params.id,
      req.user!.id,
      req.body
    );
    await auditAction.update(req, "payroll_runs", run.id, undefined, {
      status: "PROCESSING",
    });
    return sendSuccess(res, run, SUCCESS_MESSAGES.PAYROLL_PROCESSED);
  }

  async completePayroll(req: AuthRequest, res: Response): Promise<Response> {
    const run = await payrollService.completePayroll(
      req.user!.companyId!,
      req.params.id
    );
    await auditAction.update(req, "payroll_runs", run.id, undefined, {
      status: "COMPLETED",
    });
    return sendSuccess(res, run, "Payroll completed and notifications sent");
  }

  async markPaid(req: AuthRequest, res: Response): Promise<Response> {
    const run = await payrollService.markPaid(
      req.user!.companyId!,
      req.params.id,
      req.body
    );
    await auditAction.update(req, "payroll_runs", run.id, undefined, {
      status: "PAID",
    });
    return sendSuccess(res, run, "Payroll marked as paid");
  }

  async getMyPayslips(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );

    const { payslips, total } = await payrollService.getEmployeePayslips(
      req.user!.companyId!,
      req.user!.employeeId!,
      pagination
    );

    return sendPaginated(
      res,
      payslips,
      total,
      pagination.page,
      pagination.limit
    );
  }

  async getEmployeePayslips(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );

    const { payslips, total } = await payrollService.getEmployeePayslips(
      req.user!.companyId!,
      req.params.employeeId,
      pagination
    );

    return sendPaginated(
      res,
      payslips,
      total,
      pagination.page,
      pagination.limit
    );
  }

  async getPayslip(req: AuthRequest, res: Response): Promise<Response> {
    const payslip = await payrollService.getPayslip(
      req.user!.companyId!,
      req.params.id
    );
    return sendSuccess(res, payslip);
  }
}

export const payrollController = new PayrollController();
