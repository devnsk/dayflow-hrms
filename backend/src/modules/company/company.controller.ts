import { Response } from "express";
import { AuthRequest } from "../../shared/types";
import { companyService } from "./company.service";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
} from "../../shared/utils/response";
import { SUCCESS_MESSAGES } from "../../shared/constants";
import { parsePaginationParams } from "../../shared/utils/helpers";
import { auditAction } from "../../shared/middleware";
class CompanyController {
  async getCompany(req: AuthRequest, res: Response): Promise<Response> {
    const company = await companyService.getCompany(req.user!.companyId!);
    return sendSuccess(res, company);
  }

  async updateCompany(req: AuthRequest, res: Response): Promise<Response> {
    const company = await companyService.updateCompany(
      req.user!.companyId!,
      req.body
    );
    await auditAction.update(req, "companies", company.id, undefined, req.body);
    return sendSuccess(res, company, SUCCESS_MESSAGES.UPDATED);
  }

  async listDepartments(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const { search, isActive } = req.query as {
      search?: string;
      isActive?: string;
    };

    const { departments, total } = await companyService.listDepartments(
      req.user!.companyId!,
      pagination,
      search,
      isActive === "true" ? true : isActive === "false" ? false : undefined
    );

    return sendPaginated(
      res,
      departments,
      total,
      pagination.page,
      pagination.limit
    );
  }

  async getDepartment(req: AuthRequest, res: Response): Promise<Response> {
    const department = await companyService.getDepartment(
      req.user!.companyId!,
      req.params.id
    );
    return sendSuccess(res, department);
  }

  async createDepartment(req: AuthRequest, res: Response): Promise<Response> {
    const department = await companyService.createDepartment(
      req.user!.companyId!,
      req.body
    );
    await auditAction.create(req, "departments", department.id, req.body);
    return sendCreated(res, department, SUCCESS_MESSAGES.CREATED);
  }

  async updateDepartment(req: AuthRequest, res: Response): Promise<Response> {
    const department = await companyService.updateDepartment(
      req.user!.companyId!,
      req.params.id,
      req.body
    );
    await auditAction.update(
      req,
      "departments",
      department.id,
      undefined,
      req.body
    );
    return sendSuccess(res, department, SUCCESS_MESSAGES.UPDATED);
  }

  async deleteDepartment(req: AuthRequest, res: Response): Promise<Response> {
    await companyService.deleteDepartment(req.user!.companyId!, req.params.id);
    await auditAction.delete(req, "departments", req.params.id);
    return sendNoContent(res);
  }

  async listDesignations(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const { search, isActive } = req.query as {
      search?: string;
      isActive?: string;
    };

    const { designations, total } = await companyService.listDesignations(
      req.user!.companyId!,
      pagination,
      search,
      isActive === "true" ? true : isActive === "false" ? false : undefined
    );

    return sendPaginated(
      res,
      designations,
      total,
      pagination.page,
      pagination.limit
    );
  }

  async createDesignation(req: AuthRequest, res: Response): Promise<Response> {
    const designation = await companyService.createDesignation(
      req.user!.companyId!,
      req.body
    );
    await auditAction.create(req, "designations", designation.id, req.body);
    return sendCreated(res, designation, SUCCESS_MESSAGES.CREATED);
  }

  async updateDesignation(req: AuthRequest, res: Response): Promise<Response> {
    const designation = await companyService.updateDesignation(
      req.user!.companyId!,
      req.params.id,
      req.body
    );
    await auditAction.update(
      req,
      "designations",
      designation.id,
      undefined,
      req.body
    );
    return sendSuccess(res, designation, SUCCESS_MESSAGES.UPDATED);
  }

  async deleteDesignation(req: AuthRequest, res: Response): Promise<Response> {
    await companyService.deleteDesignation(req.user!.companyId!, req.params.id);
    await auditAction.delete(req, "designations", req.params.id);
    return sendNoContent(res);
  }

  async listLocations(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const { search, isActive } = req.query as {
      search?: string;
      isActive?: string;
    };

    const { locations, total } = await companyService.listLocations(
      req.user!.companyId!,
      pagination,
      search,
      isActive === "true" ? true : isActive === "false" ? false : undefined
    );

    return sendPaginated(
      res,
      locations,
      total,
      pagination.page,
      pagination.limit
    );
  }

  async createLocation(req: AuthRequest, res: Response): Promise<Response> {
    const location = await companyService.createLocation(
      req.user!.companyId!,
      req.body
    );
    await auditAction.create(req, "locations", location.id, req.body);
    return sendCreated(res, location, SUCCESS_MESSAGES.CREATED);
  }

  async updateLocation(req: AuthRequest, res: Response): Promise<Response> {
    const location = await companyService.updateLocation(
      req.user!.companyId!,
      req.params.id,
      req.body
    );
    await auditAction.update(
      req,
      "locations",
      location.id,
      undefined,
      req.body
    );
    return sendSuccess(res, location, SUCCESS_MESSAGES.UPDATED);
  }

  async deleteLocation(req: AuthRequest, res: Response): Promise<Response> {
    await companyService.deleteLocation(req.user!.companyId!, req.params.id);
    await auditAction.delete(req, "locations", req.params.id);
    return sendNoContent(res);
  }

  async listShifts(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const { isActive } = req.query as { isActive?: string };

    const { shifts, total } = await companyService.listShifts(
      req.user!.companyId!,
      pagination,
      isActive === "true" ? true : isActive === "false" ? false : undefined
    );

    return sendPaginated(res, shifts, total, pagination.page, pagination.limit);
  }

  async createShift(req: AuthRequest, res: Response): Promise<Response> {
    const shift = await companyService.createShift(
      req.user!.companyId!,
      req.body
    );
    await auditAction.create(req, "shifts", shift.id, req.body);
    return sendCreated(res, shift, SUCCESS_MESSAGES.CREATED);
  }

  async updateShift(req: AuthRequest, res: Response): Promise<Response> {
    const shift = await companyService.updateShift(
      req.user!.companyId!,
      req.params.id,
      req.body
    );
    await auditAction.update(req, "shifts", shift.id, undefined, req.body);
    return sendSuccess(res, shift, SUCCESS_MESSAGES.UPDATED);
  }

  async deleteShift(req: AuthRequest, res: Response): Promise<Response> {
    await companyService.deleteShift(req.user!.companyId!, req.params.id);
    await auditAction.delete(req, "shifts", req.params.id);
    return sendNoContent(res);
  }

  async listHolidays(req: AuthRequest, res: Response): Promise<Response> {
    const { year } = req.query as { year?: string };
    const holidays = await companyService.listHolidays(
      req.user!.companyId!,
      year ? parseInt(year, 10) : undefined
    );
    return sendSuccess(res, holidays);
  }

  async createHoliday(req: AuthRequest, res: Response): Promise<Response> {
    const holiday = await companyService.createHoliday(
      req.user!.companyId!,
      req.body
    );
    await auditAction.create(req, "holidays", holiday.id, req.body);
    return sendCreated(res, holiday, SUCCESS_MESSAGES.CREATED);
  }

  async updateHoliday(req: AuthRequest, res: Response): Promise<Response> {
    const holiday = await companyService.updateHoliday(
      req.user!.companyId!,
      req.params.id,
      req.body
    );
    await auditAction.update(req, "holidays", holiday.id, undefined, req.body);
    return sendSuccess(res, holiday, SUCCESS_MESSAGES.UPDATED);
  }

  async deleteHoliday(req: AuthRequest, res: Response): Promise<Response> {
    await companyService.deleteHoliday(req.user!.companyId!, req.params.id);
    await auditAction.delete(req, "holidays", req.params.id);
    return sendNoContent(res);
  }
}

export const companyController = new CompanyController();
