import { Response } from "express";
import { AuthRequest } from "../../shared/types";
import { attendanceService } from "./attendance.service";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
} from "../../shared/utils/response";
import { SUCCESS_MESSAGES } from "../../shared/constants";
import { parsePaginationParams } from "../../shared/utils/helpers";
import { auditAction } from "../../shared/middleware";

class AttendanceController {
  async checkIn(req: AuthRequest, res: Response): Promise<Response> {
    const attendance = await attendanceService.checkIn(
      req.user!.companyId!,
      req.user!.employeeId!,
      req.body,
      req.ip
    );
    return sendSuccess(res, attendance, SUCCESS_MESSAGES.CHECKED_IN);
  }

  async checkOut(req: AuthRequest, res: Response): Promise<Response> {
    const attendance = await attendanceService.checkOut(
      req.user!.companyId!,
      req.user!.employeeId!,
      req.body
    );
    return sendSuccess(res, attendance, SUCCESS_MESSAGES.CHECKED_OUT);
  }

  async getTodayAttendance(req: AuthRequest, res: Response): Promise<Response> {
    const attendance = await attendanceService.getTodayAttendance(
      req.user!.employeeId!
    );
    return sendSuccess(res, attendance);
  }

  async listAttendance(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const filters = {
      employeeId: req.query.employeeId as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
      status: req.query.status as string | undefined,
      date: req.query.date ? new Date(req.query.date as string) : undefined,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
    };

    const { records, total } = await attendanceService.listAttendance(
      req.user!.companyId!,
      pagination,
      filters
    );

    return sendPaginated(
      res,
      records,
      total,
      pagination.page,
      pagination.limit
    );
  }

  async createManualAttendance(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const attendance = await attendanceService.createManualAttendance(
      req.user!.companyId!,
      req.body
    );
    await auditAction.create(req, "attendance_logs", attendance.id, req.body);
    return sendCreated(res, attendance, SUCCESS_MESSAGES.CREATED);
  }

  async submitCorrectionRequest(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const attendance = await attendanceService.submitCorrectionRequest(
      req.user!.employeeId!,
      req.body
    );
    return sendSuccess(res, attendance, "Correction request submitted");
  }

  async handleCorrectionRequest(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const attendance = await attendanceService.handleCorrectionRequest(
      req.user!.companyId!,
      req.params.id,
      req.user!.id,
      req.body
    );
    await auditAction.update(
      req,
      "attendance_logs",
      attendance.id,
      undefined,
      req.body
    );
    return sendSuccess(
      res,
      attendance,
      req.body.approved ? "Correction approved" : "Correction rejected"
    );
  }

  async getMonthlySummary(req: AuthRequest, res: Response): Promise<Response> {
    const { month, year, employeeId, departmentId } = req.query as {
      month: string;
      year: string;
      employeeId?: string;
      departmentId?: string;
    };

    const summary = await attendanceService.getMonthlySummary(
      req.user!.companyId!,
      parseInt(month, 10),
      parseInt(year, 10),
      employeeId,
      departmentId
    );

    return sendSuccess(res, summary);
  }

  async getMyAttendanceHistory(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const filters = {
      employeeId: req.user!.employeeId!,
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
    };

    const { records, total } = await attendanceService.listAttendance(
      req.user!.companyId!,
      pagination,
      filters
    );

    return sendPaginated(
      res,
      records,
      total,
      pagination.page,
      pagination.limit
    );
  }
}

export const attendanceController = new AttendanceController();
