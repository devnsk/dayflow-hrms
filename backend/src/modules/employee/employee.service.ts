import { prisma, TransactionClient } from "../../prisma/client";
import {
  EmployeeStatus,
  EmploymentType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { NotFoundError, ConflictError } from "../../shared/utils/errors";
import { ERROR_MESSAGES } from "../../shared/constants";
import { PaginationParams, EmployeeFilters } from "../../shared/types";
import {
  calculateOffset,
  generateEmployeeCode,
} from "../../shared/utils/helpers";
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
  CreateSalaryStructureInput,
} from "./employee.validators";

class EmployeeService {
  async listEmployees(
    companyId: string,
    pagination: PaginationParams,
    filters: EmployeeFilters
  ) {
    const where = {
      companyId,
      deletedAt: null,
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters.designationId
        ? { designationId: filters.designationId }
        : {}),
      ...(filters.locationId ? { locationId: filters.locationId } : {}),
      ...(filters.managerId ? { managerId: filters.managerId } : {}),
      ...(filters.status ? { status: filters.status as EmployeeStatus } : {}),
      ...(filters.employmentType
        ? { employmentType: filters.employmentType as EmploymentType }
        : {}),
      ...(filters.search
        ? {
            OR: [
              {
                firstName: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
              {
                lastName: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
              {
                employeeCode: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { [pagination.sortBy || "createdAt"]: pagination.sortOrder },
        skip: calculateOffset(pagination.page, pagination.limit),
        take: pagination.limit,
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profilePhoto: true,
          employmentType: true,
          status: true,
          joiningDate: true,
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, title: true } },
          location: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return { employees, total };
  }

  async getEmployee(companyId: string, employeeId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, role: true, status: true } },
        department: { select: { id: true, name: true, code: true } },
        designation: { select: { id: true, title: true, level: true } },
        location: { select: { id: true, name: true, city: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        shift: {
          select: { id: true, name: true, startTime: true, endTime: true },
        },
        directReports: {
          select: { id: true, firstName: true, lastName: true, email: true },
          where: { deletedAt: null },
        },
        salaryStructure: true,
      },
    });

    if (!employee) {
      throw new NotFoundError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    return employee;
  }

  async createEmployee(companyId: string, input: CreateEmployeeInput) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError("An employee with this email already exists");
    }

    // Get next employee code
    const lastEmployee = await prisma.employee.findFirst({
      where: { companyId },
      orderBy: { employeeCode: "desc" },
    });

    const nextSequence = lastEmployee
      ? parseInt(lastEmployee.employeeCode.replace("EMP", "")) + 1
      : 1;
    const employeeCode = generateEmployeeCode(nextSequence);

    // Calculate salary fields if salary structure provided
    const grossSalary = (input as unknown as { basicSalary?: number })
      .basicSalary
      ? this.calculateGrossSalary(
          input as unknown as CreateSalaryStructureInput
        )
      : undefined;

    // Create user and employee in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: input.email,
          role: UserRole.EMPLOYEE,
          status: UserStatus.PENDING,
          companyId,
        },
      });

      // Create employee
      const employee = await tx.employee.create({
        data: {
          employeeCode,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          personalEmail: input.personalEmail,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          maritalStatus: input.maritalStatus,
          bloodGroup: input.bloodGroup,
          nationality: input.nationality,
          currentAddress: input.currentAddress,
          permanentAddress: input.permanentAddress,
          emergencyName: input.emergencyName,
          emergencyPhone: input.emergencyPhone,
          emergencyRelation: input.emergencyRelation,
          employmentType: input.employmentType,
          joiningDate: input.joiningDate,
          confirmationDate: input.confirmationDate,
          probationEndDate: input.probationEndDate,
          bankName: input.bankName,
          bankAccountNo: input.bankAccountNo,
          bankIfscCode: input.bankIfscCode,
          panNumber: input.panNumber,
          aadharNumber: input.aadharNumber,
          userId: user.id,
          companyId,
          departmentId: input.departmentId,
          designationId: input.designationId,
          locationId: input.locationId,
          managerId: input.managerId,
          shiftId: input.shiftId,
        },
        include: {
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, title: true } },
          location: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return { user, employee };
    });

    return result.employee;
  }

  /**
   * Update employee
   */
  async updateEmployee(
    companyId: string,
    employeeId: string,
    input: UpdateEmployeeInput
  ) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    // If email is being updated, check for duplicates
    if (input.email && input.email !== employee.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existingUser && existingUser.id !== employee.userId) {
        throw new ConflictError("An employee with this email already exists");
      }

      // Update user email as well
      await prisma.user.update({
        where: { id: employee.userId },
        data: { email: input.email },
      });
    }

    return prisma.employee.update({
      where: { id: employeeId },
      data: input,
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        location: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateEmployeeStatus(
    companyId: string,
    employeeId: string,
    input: UpdateEmployeeStatusInput
  ) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    // Update user status if employee is being terminated/resigned
    if (
      (
        [EmployeeStatus.TERMINATED, EmployeeStatus.RESIGNED] as EmployeeStatus[]
      ).includes(input.status)
    ) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { status: UserStatus.INACTIVE },
      });
    }

    return prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: input.status,
        resignationDate: input.resignationDate,
        lastWorkingDate: input.lastWorkingDate,
        exitReason: input.exitReason,
      },
    });
  }

  async deleteEmployee(companyId: string, employeeId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    // Soft delete both user and employee
    await prisma.$transaction([
      prisma.user.update({
        where: { id: employee.userId },
        data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
      }),
      prisma.employee.update({
        where: { id: employeeId },
        data: { deletedAt: new Date() },
      }),
    ]);
  }

  async getDirectReports(companyId: string, managerId: string) {
    return prisma.employee.findMany({
      where: {
        companyId,
        managerId,
        deletedAt: null,
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        profilePhoto: true,
        status: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
      },
    });
  }

  async getOrgHierarchy(companyId: string) {
    const employees = await prisma.employee.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhoto: true,
        managerId: true,
        department: { select: { name: true } },
        designation: { select: { title: true, level: true } },
      },
      orderBy: [{ designation: { level: "desc" } }, { firstName: "asc" }],
    });

    return this.buildHierarchy(employees);
  }

  private buildHierarchy(
    employees: Array<{
      id: string;
      firstName: string;
      lastName: string;
      profilePhoto: string | null;
      managerId: string | null;
      department: { name: string } | null;
      designation: { title: string; level: number } | null;
    }>
  ) {
    const map = new Map<string, unknown>();
    const roots: unknown[] = [];

    // First pass: create nodes
    for (const emp of employees) {
      map.set(emp.id, {
        ...emp,
        children: [],
      });
    }

    // Second pass: build tree
    for (const emp of employees) {
      const node = map.get(emp.id);
      if (emp.managerId && map.has(emp.managerId)) {
        const parent = map.get(emp.managerId) as { children: unknown[] };
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async getSalaryStructure(companyId: string, employeeId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId, deletedAt: null },
      include: { salaryStructure: true },
    });

    if (!employee) {
      throw new NotFoundError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    return employee.salaryStructure;
  }

  async upsertSalaryStructure(
    companyId: string,
    employeeId: string,
    input: CreateSalaryStructureInput
  ) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    const grossSalary = this.calculateGrossSalary(input);
    const totalDeductions = this.calculateTotalDeductions(input);
    const netSalary = grossSalary - totalDeductions;
    const ctc = grossSalary * 12 + input.pf * 12 + input.esi * 12;

    return prisma.salaryStructure.upsert({
      where: { employeeId },
      create: {
        employeeId,
        basicSalary: input.basicSalary,
        hra: input.hra,
        da: input.da,
        ta: input.ta,
        specialAllowance: input.specialAllowance,
        medicalAllowance: input.medicalAllowance,
        otherAllowances: input.otherAllowances || [],
        pf: input.pf,
        esi: input.esi,
        professionalTax: input.professionalTax,
        tds: input.tds,
        otherDeductions: input.otherDeductions || [],
        grossSalary,
        netSalary,
        ctc,
        effectiveFrom: input.effectiveFrom,
      },
      update: {
        basicSalary: input.basicSalary,
        hra: input.hra,
        da: input.da,
        ta: input.ta,
        specialAllowance: input.specialAllowance,
        medicalAllowance: input.medicalAllowance,
        otherAllowances: input.otherAllowances || [],
        pf: input.pf,
        esi: input.esi,
        professionalTax: input.professionalTax,
        tds: input.tds,
        otherDeductions: input.otherDeductions || [],
        grossSalary,
        netSalary,
        ctc,
        effectiveFrom: input.effectiveFrom,
      },
    });
  }

  private calculateGrossSalary(input: CreateSalaryStructureInput): number {
    const otherAllowancesTotal = (input.otherAllowances || []).reduce(
      (sum, a) => sum + a.amount,
      0
    );
    return (
      input.basicSalary +
      input.hra +
      input.da +
      input.ta +
      input.specialAllowance +
      input.medicalAllowance +
      otherAllowancesTotal
    );
  }

  private calculateTotalDeductions(input: CreateSalaryStructureInput): number {
    const otherDeductionsTotal = (input.otherDeductions || []).reduce(
      (sum, d) => sum + d.amount,
      0
    );
    return (
      input.pf +
      input.esi +
      input.professionalTax +
      input.tds +
      otherDeductionsTotal
    );
  }
}

export const employeeService = new EmployeeService();
