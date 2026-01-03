import { Response } from "express";
import { AuthRequest } from "../../shared/types";
import { employeeService } from "./employee.service";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
} from "../../shared/utils/response";
import { SUCCESS_MESSAGES } from "../../shared/constants";
import { parsePaginationParams } from "../../shared/utils/helpers";
import { auditAction } from "../../shared/middleware";

class EmployeeController {
  async listEmployees(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const filters = {
      search: req.query.search as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
      designationId: req.query.designationId as string | undefined,
      locationId: req.query.locationId as string | undefined,
      managerId: req.query.managerId as string | undefined,
      status: req.query.status as string | undefined,
      employmentType: req.query.employmentType as string | undefined,
    };

    const { employees, total } = await employeeService.listEmployees(
      req.user!.companyId!,
      pagination,
      filters
    );

    return sendPaginated(
      res,
      employees,
      total,
      pagination.page,
      pagination.limit
    );
  }

  async getEmployee(req: AuthRequest, res: Response): Promise<Response> {
    const employee = await employeeService.getEmployee(
      req.user!.companyId!,
      req.params.id
    );
    return sendSuccess(res, employee);
  }

  async createEmployee(req: AuthRequest, res: Response): Promise<Response> {
    const employee = await employeeService.createEmployee(
      req.user!.companyId!,
      req.body
    );
    await auditAction.create(req, "employees", employee.id, req.body);
    return sendCreated(res, employee, SUCCESS_MESSAGES.CREATED);
  }

  async updateEmployee(req: AuthRequest, res: Response): Promise<Response> {
    const employee = await employeeService.updateEmployee(
      req.user!.companyId!,
      req.params.id,
      req.body
    );
    await auditAction.update(
      req,
      "employees",
      employee.id,
      undefined,
      req.body
    );
    return sendSuccess(res, employee, SUCCESS_MESSAGES.UPDATED);
  }

  async updateEmployeeStatus(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const employee = await employeeService.updateEmployeeStatus(
      req.user!.companyId!,
      req.params.id,
      req.body
    );
    await auditAction.update(
      req,
      "employees",
      req.params.id,
      undefined,
      req.body
    );
    return sendSuccess(res, employee, SUCCESS_MESSAGES.UPDATED);
  }

  async deleteEmployee(req: AuthRequest, res: Response): Promise<Response> {
    await employeeService.deleteEmployee(req.user!.companyId!, req.params.id);
    await auditAction.delete(req, "employees", req.params.id);
    return sendNoContent(res);
  }

  async getDirectReports(req: AuthRequest, res: Response): Promise<Response> {
    const reports = await employeeService.getDirectReports(
      req.user!.companyId!,
      req.params.id
    );
    return sendSuccess(res, reports);
  }

  async getOrgHierarchy(req: AuthRequest, res: Response): Promise<Response> {
    const hierarchy = await employeeService.getOrgHierarchy(
      req.user!.companyId!
    );
    return sendSuccess(res, hierarchy);
  }

  async getSalaryStructure(req: AuthRequest, res: Response): Promise<Response> {
    const salary = await employeeService.getSalaryStructure(
      req.user!.companyId!,
      req.params.id
    );
    return sendSuccess(res, salary);
  }

  async upsertSalaryStructure(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const salary = await employeeService.upsertSalaryStructure(
      req.user!.companyId!,
      req.params.id,
      req.body
    );
    await auditAction.update(
      req,
      "salary_structures",
      salary.id,
      undefined,
      req.body
    );
    return sendSuccess(res, salary, SUCCESS_MESSAGES.UPDATED);
  }

  async getMyProfile(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.user!.employeeId) {
      return sendSuccess(res, null);
    }
    const employee = await employeeService.getEmployee(
      req.user!.companyId!,
      req.user!.employeeId
    );
    return sendSuccess(res, employee);
  }
}

export const employeeController = new EmployeeController();
