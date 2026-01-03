import { prisma } from "../../prisma/client";
import { NotFoundError, ConflictError } from "../../shared/utils/errors";
import { ERROR_MESSAGES } from "../../shared/constants";
import { PaginationParams } from "../../shared/types";
import { calculateOffset, generateSlug } from "../../shared/utils/helpers";
import {
  CreateCompanyInput,
  UpdateCompanyInput,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateDesignationInput,
  UpdateDesignationInput,
  CreateLocationInput,
  UpdateLocationInput,
  CreateShiftInput,
  UpdateShiftInput,
  CreateHolidayInput,
  UpdateHolidayInput,
} from "./company.validators";

class CompanyService {
  async getCompany(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId, deletedAt: null },
      include: {
        _count: {
          select: {
            employees: true,
            departments: true,
            locations: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundError(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    return company;
  }

  async updateCompany(companyId: string, input: UpdateCompanyInput) {
    const company = await prisma.company.findUnique({
      where: { id: companyId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundError(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    return prisma.company.update({
      where: { id: companyId },
      data: input,
    });
  }

  async listDepartments(
    companyId: string,
    pagination: PaginationParams,
    search?: string,
    isActive?: boolean
  ) {
    const where = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        orderBy: { [pagination.sortBy || "name"]: pagination.sortOrder },
        skip: calculateOffset(pagination.page, pagination.limit),
        take: pagination.limit,
        include: {
          parent: { select: { id: true, name: true } },
          head: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { employees: true } },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return { departments, total };
  }

  async getDepartment(companyId: string, departmentId: string) {
    const department = await prisma.department.findFirst({
      where: { id: departmentId, companyId, deletedAt: null },
      include: {
        parent: { select: { id: true, name: true } },
        head: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        children: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });

    if (!department) {
      throw new NotFoundError(ERROR_MESSAGES.DEPARTMENT_NOT_FOUND);
    }

    return department;
  }

  async createDepartment(companyId: string, input: CreateDepartmentInput) {
    // Check for duplicate code
    const existing = await prisma.department.findUnique({
      where: { companyId_code: { companyId, code: input.code } },
    });

    if (existing) {
      throw new ConflictError("Department with this code already exists");
    }

    return prisma.department.create({
      data: {
        ...input,
        companyId,
      },
      include: {
        parent: { select: { id: true, name: true } },
        head: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateDepartment(
    companyId: string,
    departmentId: string,
    input: UpdateDepartmentInput
  ) {
    const department = await prisma.department.findFirst({
      where: { id: departmentId, companyId, deletedAt: null },
    });

    if (!department) {
      throw new NotFoundError(ERROR_MESSAGES.DEPARTMENT_NOT_FOUND);
    }

    if (input.code && input.code !== department.code) {
      const existing = await prisma.department.findUnique({
        where: { companyId_code: { companyId, code: input.code } },
      });
      if (existing) {
        throw new ConflictError("Department with this code already exists");
      }
    }

    return prisma.department.update({
      where: { id: departmentId },
      data: input,
      include: {
        parent: { select: { id: true, name: true } },
        head: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async deleteDepartment(companyId: string, departmentId: string) {
    const department = await prisma.department.findFirst({
      where: { id: departmentId, companyId, deletedAt: null },
      include: { _count: { select: { employees: true } } },
    });

    if (!department) {
      throw new NotFoundError(ERROR_MESSAGES.DEPARTMENT_NOT_FOUND);
    }

    if (department._count.employees > 0) {
      throw new ConflictError(ERROR_MESSAGES.DEPARTMENT_HAS_EMPLOYEES);
    }

    await prisma.department.update({
      where: { id: departmentId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async listDesignations(
    companyId: string,
    pagination: PaginationParams,
    search?: string,
    isActive?: boolean
  ) {
    const where = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? { title: { contains: search, mode: "insensitive" as const } }
        : {}),
    };

    const [designations, total] = await Promise.all([
      prisma.designation.findMany({
        where,
        orderBy: { [pagination.sortBy || "level"]: pagination.sortOrder },
        skip: calculateOffset(pagination.page, pagination.limit),
        take: pagination.limit,
        include: {
          _count: { select: { employees: true } },
        },
      }),
      prisma.designation.count({ where }),
    ]);

    return { designations, total };
  }

  async createDesignation(companyId: string, input: CreateDesignationInput) {
    const existing = await prisma.designation.findUnique({
      where: { companyId_code: { companyId, code: input.code } },
    });

    if (existing) {
      throw new ConflictError("Designation with this code already exists");
    }

    return prisma.designation.create({
      data: { ...input, companyId },
    });
  }

  async updateDesignation(
    companyId: string,
    designationId: string,
    input: UpdateDesignationInput
  ) {
    const designation = await prisma.designation.findFirst({
      where: { id: designationId, companyId, deletedAt: null },
    });

    if (!designation) {
      throw new NotFoundError("Designation not found");
    }

    if (input.code && input.code !== designation.code) {
      const existing = await prisma.designation.findUnique({
        where: { companyId_code: { companyId, code: input.code } },
      });
      if (existing) {
        throw new ConflictError("Designation with this code already exists");
      }
    }

    return prisma.designation.update({
      where: { id: designationId },
      data: input,
    });
  }

  async deleteDesignation(companyId: string, designationId: string) {
    const designation = await prisma.designation.findFirst({
      where: { id: designationId, companyId, deletedAt: null },
      include: { _count: { select: { employees: true } } },
    });

    if (!designation) {
      throw new NotFoundError("Designation not found");
    }

    if (designation._count.employees > 0) {
      throw new ConflictError(
        "Cannot delete designation with active employees"
      );
    }

    await prisma.designation.update({
      where: { id: designationId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async listLocations(
    companyId: string,
    pagination: PaginationParams,
    search?: string,
    isActive?: boolean
  ) {
    const where = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        orderBy: { [pagination.sortBy || "name"]: pagination.sortOrder },
        skip: calculateOffset(pagination.page, pagination.limit),
        take: pagination.limit,
        include: {
          _count: { select: { employees: true } },
        },
      }),
      prisma.location.count({ where }),
    ]);

    return { locations, total };
  }

  async createLocation(companyId: string, input: CreateLocationInput) {
    const existing = await prisma.location.findUnique({
      where: { companyId_code: { companyId, code: input.code } },
    });

    if (existing) {
      throw new ConflictError("Location with this code already exists");
    }

    return prisma.location.create({
      data: { ...input, companyId },
    });
  }

  async updateLocation(
    companyId: string,
    locationId: string,
    input: UpdateLocationInput
  ) {
    const location = await prisma.location.findFirst({
      where: { id: locationId, companyId, deletedAt: null },
    });

    if (!location) {
      throw new NotFoundError("Location not found");
    }

    if (input.code && input.code !== location.code) {
      const existing = await prisma.location.findUnique({
        where: { companyId_code: { companyId, code: input.code } },
      });
      if (existing) {
        throw new ConflictError("Location with this code already exists");
      }
    }

    return prisma.location.update({
      where: { id: locationId },
      data: input,
    });
  }

  async deleteLocation(companyId: string, locationId: string) {
    const location = await prisma.location.findFirst({
      where: { id: locationId, companyId, deletedAt: null },
      include: { _count: { select: { employees: true } } },
    });

    if (!location) {
      throw new NotFoundError("Location not found");
    }

    if (location._count.employees > 0) {
      throw new ConflictError("Cannot delete location with active employees");
    }

    await prisma.location.update({
      where: { id: locationId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async listShifts(
    companyId: string,
    pagination: PaginationParams,
    isActive?: boolean
  ) {
    const where = {
      companyId,
      ...(isActive !== undefined ? { isActive } : {}),
    };

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where,
        orderBy: { [pagination.sortBy || "name"]: pagination.sortOrder },
        skip: calculateOffset(pagination.page, pagination.limit),
        take: pagination.limit,
        include: {
          _count: { select: { employees: true } },
        },
      }),
      prisma.shift.count({ where }),
    ]);

    return { shifts, total };
  }

  async createShift(companyId: string, input: CreateShiftInput) {
    const existing = await prisma.shift.findUnique({
      where: { companyId_code: { companyId, code: input.code } },
    });

    if (existing) {
      throw new ConflictError("Shift with this code already exists");
    }

    if (input.isDefault) {
      await prisma.shift.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.shift.create({
      data: { ...input, companyId },
    });
  }

  async updateShift(
    companyId: string,
    shiftId: string,
    input: UpdateShiftInput
  ) {
    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, companyId },
    });

    if (!shift) {
      throw new NotFoundError("Shift not found");
    }

    if (input.isDefault) {
      await prisma.shift.updateMany({
        where: { companyId, isDefault: true, id: { not: shiftId } },
        data: { isDefault: false },
      });
    }

    return prisma.shift.update({
      where: { id: shiftId },
      data: input,
    });
  }

  async deleteShift(companyId: string, shiftId: string) {
    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, companyId },
      include: { _count: { select: { employees: true } } },
    });

    if (!shift) {
      throw new NotFoundError("Shift not found");
    }

    if (shift._count.employees > 0) {
      throw new ConflictError("Cannot delete shift assigned to employees");
    }

    await prisma.shift.delete({ where: { id: shiftId } });
  }

  async listHolidays(companyId: string, year?: number) {
    const startDate = year
      ? new Date(year, 0, 1)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = year
      ? new Date(year, 11, 31)
      : new Date(new Date().getFullYear(), 11, 31);

    return prisma.holiday.findMany({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    });
  }

  async createHoliday(companyId: string, input: CreateHolidayInput) {
    const existing = await prisma.holiday.findUnique({
      where: { companyId_date: { companyId, date: input.date } },
    });

    if (existing) {
      throw new ConflictError("A holiday already exists on this date");
    }

    return prisma.holiday.create({
      data: { ...input, companyId },
    });
  }

  async updateHoliday(
    companyId: string,
    holidayId: string,
    input: UpdateHolidayInput
  ) {
    const holiday = await prisma.holiday.findFirst({
      where: { id: holidayId, companyId },
    });

    if (!holiday) {
      throw new NotFoundError("Holiday not found");
    }

    return prisma.holiday.update({
      where: { id: holidayId },
      data: input,
    });
  }

  async deleteHoliday(companyId: string, holidayId: string) {
    const holiday = await prisma.holiday.findFirst({
      where: { id: holidayId, companyId },
    });

    if (!holiday) {
      throw new NotFoundError("Holiday not found");
    }

    await prisma.holiday.delete({ where: { id: holidayId } });
  }
}

export const companyService = new CompanyService();
