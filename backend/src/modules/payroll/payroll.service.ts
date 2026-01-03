import { prisma, TransactionClient } from "../../prisma/client";
import {
  PayrollStatus,
  EmployeeStatus,
  AttendanceStatus,
} from "@prisma/client";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../../shared/utils/errors";
import { ERROR_MESSAGES, PAYROLL_SETTINGS } from "../../shared/constants";
import { PaginationParams, PayrollFilters } from "../../shared/types";
import {
  calculateOffset,
  startOfMonth,
  endOfMonth,
  formatDate,
  getFullName,
} from "../../shared/utils/helpers";
import {
  GeneratePayrollInput,
  UpdatePayrollItemInput,
  ProcessPayrollInput,
  MarkPaidInput,
} from "./payroll.validators";
import { emailService } from "../notifications/email.service";
import { notificationService } from "../notifications/notification.service";
import dayjs from "dayjs";

class PayrollService {
  async generatePayroll(
    companyId: string,
    userId: string,
    input: GeneratePayrollInput
  ) {
    const existing = await prisma.payrollRun.findUnique({
      where: {
        companyId_month_year: {
          companyId,
          month: input.month,
          year: input.year,
        },
      },
    });

    if (existing && existing.status !== PayrollStatus.DRAFT) {
      throw new ConflictError(ERROR_MESSAGES.PAYROLL_ALREADY_EXISTS);
    }

    const periodStart = new Date(input.year, input.month - 1, 1);
    const periodEnd = new Date(input.year, input.month, 0);

    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        status: EmployeeStatus.ACTIVE,
        deletedAt: null,
        salaryStructure: { isNot: null },
      },
      include: {
        salaryStructure: true,
        user: { select: { id: true, email: true } },
      },
    });

    if (employees.length === 0) {
      throw new BadRequestError(
        "No active employees with salary structure found"
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { workingDays: true },
    });
    const workingDays = company?.workingDays || [1, 2, 3, 4, 5];

    const holidays = await prisma.holiday.findMany({
      where: {
        companyId,
        date: { gte: periodStart, lte: periodEnd },
      },
    });

    let totalWorkingDays = 0;
    for (
      let d = new Date(periodStart);
      d <= periodEnd;
      d.setDate(d.getDate() + 1)
    ) {
      const dayOfWeek = d.getDay();
      const isHoliday = holidays.some(
        (h) => h.date.toDateString() === d.toDateString()
      );
      if (workingDays.includes(dayOfWeek) && !isHoliday) {
        totalWorkingDays++;
      }
    }

    const payrollRun = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.payrollItem.deleteMany({
          where: { payrollRunId: existing.id },
        });
      }

      const run = existing
        ? await tx.payrollRun.update({
            where: { id: existing.id },
            data: {
              periodStart,
              periodEnd,
              notes: input.notes,
              totalEmployees: employees.length,
            },
          })
        : await tx.payrollRun.create({
            data: {
              companyId,
              month: input.month,
              year: input.year,
              periodStart,
              periodEnd,
              notes: input.notes,
              totalEmployees: employees.length,
              status: PayrollStatus.DRAFT,
            },
          });

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      for (const employee of employees) {
        const salary = employee.salaryStructure!;

        const attendance = await tx.attendanceLog.findMany({
          where: {
            employeeId: employee.id,
            date: { gte: periodStart, lte: periodEnd },
          },
        });

        let daysPresent = 0;
        let daysAbsent = 0;
        let paidLeaveDays = 0;
        let unpaidLeaveDays = 0;

        for (const record of attendance) {
          switch (record.status) {
            case AttendanceStatus.PRESENT:
              daysPresent++;
              break;
            case AttendanceStatus.HALF_DAY:
              daysPresent += 0.5;
              break;
            case AttendanceStatus.ON_LEAVE:
              paidLeaveDays++;
              break;
            case AttendanceStatus.ABSENT:
              daysAbsent++;
              break;
          }
        }

        const effectiveWorkingDays = daysPresent + paidLeaveDays;
        const lopDays = Math.max(
          0,
          totalWorkingDays - effectiveWorkingDays - daysAbsent
        );

        const perDaySalary = salary.grossSalary / totalWorkingDays;
        const lopDeduction = lopDays * perDaySalary;

        const attendanceRatio = Math.min(
          1,
          effectiveWorkingDays / totalWorkingDays
        );
        const basicSalary = salary.basicSalary * attendanceRatio;
        const hra = salary.hra * attendanceRatio;
        const da = salary.da * attendanceRatio;
        const ta = salary.ta * attendanceRatio;
        const specialAllowance = salary.specialAllowance * attendanceRatio;
        const grossEarnings = basicSalary + hra + da + ta + specialAllowance;

        const pf = salary.pf;
        const esi = salary.esi;
        const professionalTax = salary.professionalTax;
        const tds = salary.tds;
        const totalDeductionsAmount =
          pf + esi + professionalTax + tds + lopDeduction;

        const netSalary = grossEarnings - totalDeductionsAmount;

        await tx.payrollItem.create({
          data: {
            payrollRunId: run.id,
            employeeId: employee.id,
            totalWorkingDays,
            daysPresent: Math.round(daysPresent),
            daysAbsent: Math.round(daysAbsent),
            paidLeaveDays,
            unpaidLeaveDays: lopDays,
            basicSalary,
            hra,
            da,
            ta,
            specialAllowance,
            grossEarnings,
            pf,
            esi,
            professionalTax,
            tds,
            lopDeduction,
            totalDeductions: totalDeductionsAmount,
            netSalary,
            status: PayrollStatus.DRAFT,
          },
        });

        totalGross += grossEarnings;
        totalDeductions += totalDeductionsAmount;
        totalNet += netSalary;
      }

      return tx.payrollRun.update({
        where: { id: run.id },
        data: {
          totalGross,
          totalDeductions,
          totalNet,
        },
        include: {
          _count: { select: { items: true } },
        },
      });
    });

    return payrollRun;
  }

  async listPayrollRuns(
    companyId: string,
    pagination: PaginationParams,
    filters: PayrollFilters
  ) {
    const where = {
      companyId,
      ...(filters.month ? { month: filters.month } : {}),
      ...(filters.year ? { year: filters.year } : {}),
      ...(filters.status ? { status: filters.status as PayrollStatus } : {}),
    };

    const [runs, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        orderBy: [{ year: "desc" }, { month: "desc" }],
        skip: calculateOffset(pagination.page, pagination.limit),
        take: pagination.limit,
        include: {
          _count: { select: { items: true } },
        },
      }),
      prisma.payrollRun.count({ where }),
    ]);

    return { runs, total };
  }

  async getPayrollRun(companyId: string, payrollRunId: string) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: payrollRunId, companyId },
      include: {
        _count: { select: { items: true } },
      },
    });

    if (!run) {
      throw new NotFoundError(ERROR_MESSAGES.PAYROLL_NOT_FOUND);
    }

    return run;
  }

  async getPayrollItems(
    companyId: string,
    payrollRunId: string,
    pagination: PaginationParams,
    filters?: { employeeId?: string; departmentId?: string }
  ) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: payrollRunId, companyId },
    });

    if (!run) {
      throw new NotFoundError(ERROR_MESSAGES.PAYROLL_NOT_FOUND);
    }

    const where = {
      payrollRunId,
      ...(filters?.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters?.departmentId
        ? { employee: { departmentId: filters.departmentId } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.payrollItem.findMany({
        where,
        orderBy: { employee: { firstName: "asc" } },
        skip: calculateOffset(pagination.page, pagination.limit),
        take: pagination.limit,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: { select: { name: true } },
              designation: { select: { title: true } },
            },
          },
        },
      }),
      prisma.payrollItem.count({ where }),
    ]);

    return { items, total };
  }

  async updatePayrollItem(
    companyId: string,
    itemId: string,
    input: UpdatePayrollItemInput
  ) {
    const item = await prisma.payrollItem.findFirst({
      where: { id: itemId },
      include: { payrollRun: true },
    });

    if (!item || item.payrollRun.companyId !== companyId) {
      throw new NotFoundError("Payroll item not found");
    }

    if (item.status !== PayrollStatus.DRAFT) {
      throw new BadRequestError("Cannot update processed payroll item");
    }

    const additionalEarnings =
      (input.otherEarnings || []).reduce((sum, e) => sum + e.amount, 0) +
      (input.overtimePay || 0) +
      (input.bonus || 0);
    const additionalDeductions = (input.otherDeductions || []).reduce(
      (sum, d) => sum + d.amount,
      0
    );

    const grossEarnings = item.grossEarnings + additionalEarnings;
    const totalDeductions = item.totalDeductions + additionalDeductions;
    const netSalary = grossEarnings - totalDeductions;

    return prisma.payrollItem.update({
      where: { id: itemId },
      data: {
        overtimePay: input.overtimePay,
        bonus: input.bonus,
        otherEarnings: (input.otherEarnings as object[]) || [],
        otherDeductions: (input.otherDeductions as object[]) || [],
        grossEarnings,
        totalDeductions,
        netSalary,
      },
    });
  }

  async processPayroll(
    companyId: string,
    payrollRunId: string,
    userId: string,
    input: ProcessPayrollInput
  ) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: payrollRunId, companyId },
    });

    if (!run) {
      throw new NotFoundError(ERROR_MESSAGES.PAYROLL_NOT_FOUND);
    }

    if (run.status !== PayrollStatus.DRAFT) {
      throw new BadRequestError(ERROR_MESSAGES.PAYROLL_ALREADY_PROCESSED);
    }

    return prisma.$transaction(async (tx) => {
      await tx.payrollItem.updateMany({
        where: { payrollRunId },
        data: { status: PayrollStatus.PROCESSING },
      });

      return tx.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: PayrollStatus.PROCESSING,
          processedBy: userId,
          processedAt: new Date(),
          notes: input.notes || run.notes,
        },
      });
    });
  }

  async completePayroll(companyId: string, payrollRunId: string) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: payrollRunId, companyId },
      include: {
        items: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                user: { select: { id: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundError(ERROR_MESSAGES.PAYROLL_NOT_FOUND);
    }

    if (run.status !== PayrollStatus.PROCESSING) {
      throw new BadRequestError("Payroll must be in processing state");
    }

    const monthName = dayjs()
      .month(run.month - 1)
      .format("MMMM");
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    await prisma.$transaction(async (tx) => {
      await tx.payrollItem.updateMany({
        where: { payrollRunId },
        data: { status: PayrollStatus.COMPLETED },
      });

      await tx.payrollRun.update({
        where: { id: payrollRunId },
        data: { status: PayrollStatus.COMPLETED },
      });
    });

    for (const item of run.items) {
      const employee = item.employee;

      await notificationService.notifyPayrollGenerated(
        employee.user.id,
        monthName,
        run.year
      );

      await emailService.sendPayrollGeneratedEmail({
        to: employee.user.email,
        employeeName: getFullName(employee.firstName, employee.lastName),
        month: monthName,
        year: run.year,
        netSalary: item.netSalary.toLocaleString("en-IN"),
        payslipLink: `${frontendUrl}/payroll/payslips/${item.id}`,
      });
    }

    return run;
  }

  async markPaid(
    companyId: string,
    payrollRunId: string,
    input: MarkPaidInput
  ) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: payrollRunId, companyId },
    });

    if (!run) {
      throw new NotFoundError(ERROR_MESSAGES.PAYROLL_NOT_FOUND);
    }

    if (run.status !== PayrollStatus.COMPLETED) {
      throw new BadRequestError(
        "Payroll must be completed before marking as paid"
      );
    }

    return prisma.$transaction(async (tx) => {
      await tx.payrollItem.updateMany({
        where: { payrollRunId },
        data: { status: PayrollStatus.PAID },
      });

      return tx.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: PayrollStatus.PAID,
          paidAt: input.paidAt || new Date(),
        },
      });
    });
  }

  async getEmployeePayslips(
    companyId: string,
    employeeId: string,
    pagination: PaginationParams
  ) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      throw new NotFoundError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    const where = {
      employeeId,
      status: { in: [PayrollStatus.COMPLETED, PayrollStatus.PAID] },
    };

    const [payslips, total] = await Promise.all([
      prisma.payrollItem.findMany({
        where,
        orderBy: { payrollRun: { year: "desc" } },
        skip: calculateOffset(pagination.page, pagination.limit),
        take: pagination.limit,
        include: {
          payrollRun: {
            select: {
              month: true,
              year: true,
              periodStart: true,
              periodEnd: true,
            },
          },
        },
      }),
      prisma.payrollItem.count({ where }),
    ]);

    return { payslips, total };
  }

  async getPayslip(companyId: string, payslipId: string) {
    const payslip = await prisma.payrollItem.findFirst({
      where: { id: payslipId },
      include: {
        payrollRun: {
          select: {
            month: true,
            year: true,
            periodStart: true,
            periodEnd: true,
            companyId: true,
            company: {
              select: { name: true, address: true, city: true, state: true },
            },
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            department: { select: { name: true } },
            designation: { select: { title: true } },
            bankName: true,
            bankAccountNo: true,
            panNumber: true,
            joiningDate: true,
          },
        },
      },
    });

    if (!payslip || payslip.payrollRun.companyId !== companyId) {
      throw new NotFoundError("Payslip not found");
    }

    return payslip;
  }
}

export const payrollService = new PayrollService();
