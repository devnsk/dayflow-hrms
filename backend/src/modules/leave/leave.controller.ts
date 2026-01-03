import { Response } from "express";
import { AuthRequest } from "../../shared/types";
import { leaveService } from "./leave.service";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
} from "../../shared/utils/response";
import { SUCCESS_MESSAGES } from "../../shared/constants";
import { parsePaginationParams } from "../../shared/utils/helpers";
import { auditAction } from "../../shared/middleware";

class LeaveController {
  async listLeaveTypes(req: AuthRequest, res: Response): Promise<Response> {
    const isActive =
      req.query.isActive === "true"
        ? true
        : req.query.isActive === "false"
        ? false
        : undefined;
    const leaveTypes = await leaveService.listLeaveTypes(
      req.user!.companyId!,
      isActive
    );
    return sendSuccess(res, leaveTypes);
  }

  async createLeaveType(req: AuthRequest, res: Response): Promise<Response> {
    const leaveType = await leaveService.createLeaveType(
      req.user!.companyId!,
      req.body
    );
    await auditAction.create(
      req,
      "company_leave_types",
      leaveType.id,
      req.body
    );
    return sendCreated(res, leaveType, SUCCESS_MESSAGES.CREATED);
  }

  async updateLeaveType(req: AuthRequest, res: Response): Promise<Response> {
    const leaveType = await leaveService.updateLeaveType(
      req.user!.companyId!,
      req.params.id,
      req.body
    );
    await auditAction.update(
      req,
      "company_leave_types",
      leaveType.id,
      undefined,
      req.body
    );
    return sendSuccess(res, leaveType, SUCCESS_MESSAGES.UPDATED);
  }

  async deleteLeaveType(req: AuthRequest, res: Response): Promise<Response> {
    await leaveService.deleteLeaveType(req.user!.companyId!, req.params.id);
    await auditAction.delete(req, "company_leave_types", req.params.id);
    return sendNoContent(res);
  }

  async applyLeave(req: AuthRequest, res: Response): Promise<Response> {
    const leaveRequest = await leaveService.applyLeave(
      req.user!.companyId!,
      req.user!.employeeId!,
      req.user!.id,
      req.body
    );
    await auditAction.create(req, "leave_requests", leaveRequest.id, req.body);
    return sendCreated(res, leaveRequest, SUCCESS_MESSAGES.LEAVE_APPLIED);
  }

  async listLeaveRequests(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const filters = {
      employeeId: req.query.employeeId as string | undefined,
      leaveTypeId: req.query.leaveTypeId as string | undefined,
      status: req.query.status as string | undefined,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
    };

    const { requests, total } = await leaveService.listLeaveRequests(
      req.user!.companyId!,
      pagination,
      filters
    );

    return sendPaginated(
      res,
      requests,
      total,
      pagination.page,
      pagination.limit
    );
  }

  async getMyLeaveRequests(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const filters = {
      employeeId: req.user!.employeeId!,
      status: req.query.status as string | undefined,
    };

    const { requests, total } = await leaveService.listLeaveRequests(
      req.user!.companyId!,
      pagination,
      filters
    );

    return sendPaginated(
      res,
      requests,
      total,
      pagination.page,
      pagination.limit
    );
  }

  async getPendingForManager(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const requests = await leaveService.getPendingForManager(
      req.user!.companyId!,
      req.user!.employeeId!
    );
    return sendSuccess(res, requests);
  }

  async handleLeaveAction(req: AuthRequest, res: Response): Promise<Response> {
    const leaveRequest = await leaveService.handleLeaveAction(
      req.user!.companyId!,
      req.params.id,
      req.user!.id,
      req.body
    );

    if (req.body.status === "APPROVED") {
      await auditAction.approve(
        req,
        "leave_requests",
        leaveRequest.id,
        req.body
      );
    } else {
      await auditAction.reject(
        req,
        "leave_requests",
        leaveRequest.id,
        req.body
      );
    }

    return sendSuccess(
      res,
      leaveRequest,
      req.body.status === "APPROVED"
        ? SUCCESS_MESSAGES.LEAVE_APPROVED
        : SUCCESS_MESSAGES.LEAVE_REJECTED
    );
  }

  async cancelLeave(req: AuthRequest, res: Response): Promise<Response> {
    const leaveRequest = await leaveService.cancelLeave(
      req.user!.employeeId!,
      req.params.id,
      req.body
    );
    await auditAction.update(
      req,
      "leave_requests",
      leaveRequest.id,
      undefined,
      { status: "CANCELLED", ...req.body }
    );
    return sendSuccess(res, leaveRequest, SUCCESS_MESSAGES.LEAVE_CANCELLED);
  }

  async getMyBalances(req: AuthRequest, res: Response): Promise<Response> {
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : undefined;
    const balances = await leaveService.getLeaveBalances(
      req.user!.companyId!,
      req.user!.employeeId!,
      year
    );
    return sendSuccess(res, balances);
  }

  async getEmployeeBalances(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : undefined;
    const balances = await leaveService.getLeaveBalances(
      req.user!.companyId!,
      req.params.employeeId,
      year
    );
    return sendSuccess(res, balances);
  }

  async adjustBalance(req: AuthRequest, res: Response): Promise<Response> {
    const balance = await leaveService.adjustBalance(
      req.user!.companyId!,
      req.params.employeeId,
      req.body
    );
    await auditAction.update(
      req,
      "leave_balances",
      balance.id,
      undefined,
      req.body
    );
    return sendSuccess(res, balance, SUCCESS_MESSAGES.UPDATED);
  }

  async getLeaveCalendar(req: AuthRequest, res: Response): Promise<Response> {
    const { month, year, departmentId } = req.query as {
      month: string;
      year: string;
      departmentId?: string;
    };

    const calendar = await leaveService.getLeaveCalendar(
      req.user!.companyId!,
      parseInt(month, 10),
      parseInt(year, 10),
      departmentId
    );

    return sendSuccess(res, calendar);
  }
}

export const leaveController = new LeaveController();
