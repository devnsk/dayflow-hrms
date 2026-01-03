import { prisma, TransactionClient } from "../../prisma/client";
import { LeaveStatus, AttendanceStatus } from "@prisma/client";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../../shared/utils/errors";
import { ERROR_MESSAGES } from "../../shared/constants";
import { PaginationParams, LeaveFilters } from "../../shared/types";
import {
  calculateOffset,
  daysBetween,
  getWorkingDaysCount,
  formatDate,
  getFullName,
} from "../../shared/utils/helpers";
import {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  ApplyLeaveInput,
  LeaveActionInput,
  CancelLeaveInput,
  AdjustBalanceInput,
} from "./leave.validators";
import { emailService } from "../notifications/email.service";
import { notificationService } from "../notifications/notification.service";

class LeaveService {
  async listLeaveTypes(companyId: string, isActive?: boolean) {
    return prisma.companyLeaveType.findMany({
      where: {
        companyId,
        ...(isActive !== undefined ? { isActive } : {}),
      },
      orderBy: { name: "asc" },
    });
  }

  async createLeaveType(companyId: string, input: CreateLeaveTypeInput) {
    const existing = await prisma.companyLeaveType.findUnique({
      where: { companyId_code: { companyId, code: input.code } },
    });

    if (existing) {
      throw new ConflictError("Leave type with this code already exists");
    }

    return prisma.companyLeaveType.create({
      data: { ...input, companyId },
    });
  }

  async updateLeaveType(
    companyId: string,
    leaveTypeId: string,
    input: UpdateLeaveTypeInput
  ) {
    const leaveType = await prisma.companyLeaveType.findFirst({
      where: { id: leaveTypeId, companyId },
    });

    if (!leaveType) {
      throw new NotFoundError("Leave type not found");
    }

    if (input.code && input.code !== leaveType.code) {
      const existing = await prisma.companyLeaveType.findUnique({
        where: { companyId_code: { companyId, code: input.code } },
      });
      if (existing) {
        throw new ConflictError("Leave type with this code already exists");
      }
    }

    return prisma.companyLeaveType.update({
      where: { id: leaveTypeId },
      data: input,
    });
  }

  async deleteLeaveType(companyId: string, leaveTypeId: string) {
    const leaveType = await prisma.companyLeaveType.findFirst({
      where: { id: leaveTypeId, companyId },
      include: { _count: { select: { leaveRequests: true } } },
    });

    if (!leaveType) {
      throw new NotFoundError("Leave type not found");
    }

    if (leaveType._count.leaveRequests > 0) {
      await prisma.companyLeaveType.update({
        where: { id: leaveTypeId },
        data: { isActive: false },
      });
    } else {
      await prisma.companyLeaveType.delete({
        where: { id: leaveTypeId },
      });
    }
  }

  async applyLeave(
    companyId: string,
    employeeId: string,
    userId: string,
    input: ApplyLeaveInput
  ) {
    const leaveType = await prisma.companyLeaveType.findFirst({
      where: { id: input.leaveTypeId, companyId, isActive: true },
    });

    if (!leaveType) {
      throw new NotFoundError("Leave type not found");
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: {
        manager: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });

    if (!employee) {
      throw new NotFoundError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { workingDays: true },
    });
    const workingDays = company?.workingDays || [1, 2, 3, 4, 5];

    let totalDays: number;
    if (input.isHalfDay) {
      totalDays = 0.5;
    } else {
      totalDays = getWorkingDaysCount(
        input.startDate,
        input.endDate,
        workingDays
      );
    }

    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        OR: [
          {
            startDate: { lte: input.endDate },
            endDate: { gte: input.startDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictError(ERROR_MESSAGES.LEAVE_OVERLAP);
    }

    const year = input.startDate.getFullYear();
    let balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId: input.leaveTypeId,
          year,
        },
      },
    });

    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveTypeId: input.leaveTypeId,
          year,
          allocated: leaveType.defaultBalance,
        },
      });
    }

    const availableBalance =
      balance.allocated +
      balance.carryForward +
      balance.adjustment -
      balance.used -
      balance.pending;

    if (availableBalance < totalDays && !leaveType.allowNegativeBalance) {
      throw new BadRequestError(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
    }

    if (leaveType.minDaysNotice > 0) {
      const daysUntilStart = Math.ceil(
        (input.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilStart < leaveType.minDaysNotice) {
        throw new BadRequestError(
          `Minimum ${leaveType.minDaysNotice} days notice required for ${leaveType.name}`
        );
      }
    }

    if (
      leaveType.maxConsecutiveDays &&
      totalDays > leaveType.maxConsecutiveDays
    ) {
      throw new BadRequestError(
        `Maximum ${leaveType.maxConsecutiveDays} consecutive days allowed for ${leaveType.name}`
      );
    }

    const leaveRequest = await prisma.$transaction(async (tx) => {
      await tx.leaveBalance.update({
        where: { id: balance!.id },
        data: { pending: { increment: totalDays } },
      });

      return tx.leaveRequest.create({
        data: {
          employeeId,
          leaveTypeId: input.leaveTypeId,
          startDate: input.startDate,
          endDate: input.endDate,
          totalDays,
          isHalfDay: input.isHalfDay,
          halfDayType: input.halfDayType,
          reason: input.reason,
          status: leaveType.requiresApproval
            ? LeaveStatus.PENDING
            : LeaveStatus.APPROVED,
        },
        include: {
          leaveType: { select: { name: true } },
        },
      });
    });

    if (employee.manager && leaveType.requiresApproval) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      await notificationService.notifyLeaveRequest(
        employee.manager.user.id,
        getFullName(employee.firstName, employee.lastName),
        leaveRequest.leaveType.name
      );

      await emailService.sendLeaveRequestEmail({
        to: employee.manager.user.email,
        managerName: getFullName(
          employee.manager.firstName,
          employee.manager.lastName
        ),
        employeeName: getFullName(employee.firstName, employee.lastName),
        leaveType: leaveRequest.leaveType.name,
        startDate: formatDate(input.startDate),
        endDate: formatDate(input.endDate),
        reason: input.reason,
        approvalLink: `${frontendUrl}/leave/requests/${leaveRequest.id}`,
      });
    }

    return leaveRequest;
  }

  async listLeaveRequests(
    companyId: string,
    pagination: PaginationParams,
    filters: LeaveFilters
  ) {
    const where = {
      employee: { companyId },
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters.leaveTypeId ? { leaveTypeId: filters.leaveTypeId } : {}),
      ...(filters.status ? { status: filters.status as LeaveStatus } : {}),
      ...(filters.startDate && filters.endDate
        ? {
            OR: [
              { startDate: { gte: filters.startDate, lte: filters.endDate } },
              { endDate: { gte: filters.startDate, lte: filters.endDate } },
            ],
          }
        : {}),
    };

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
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
            },
          },
          leaveType: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return { requests, total };
  }

  async getPendingForManager(companyId: string, managerId: string) {
    return prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.PENDING,
        employee: {
          companyId,
          managerId,
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            profilePhoto: true,
          },
        },
        leaveType: { select: { name: true } },
      },
    });
  }

  async handleLeaveAction(
    companyId: string,
    leaveRequestId: string,
    approverId: string,
    input: LeaveActionInput
  ) {
    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        employee: { companyId },
        status: LeaveStatus.PENDING,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: { select: { id: true, email: true } },
          },
        },
        leaveType: { select: { name: true, isPaid: true } },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundError(ERROR_MESSAGES.LEAVE_NOT_FOUND);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update leave balance
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year: leaveRequest.startDate.getFullYear(),
          },
        },
      });

      if (balance) {
        if (input.status === LeaveStatus.APPROVED) {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              pending: { decrement: leaveRequest.totalDays },
              used: { increment: leaveRequest.totalDays },
            },
          });

          // Mark attendance as on leave
          await this.markAttendanceAsLeave(
            tx,
            leaveRequest.employeeId,
            leaveRequest.startDate,
            leaveRequest.endDate
          );
        } else {
          // Just remove from pending
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: { pending: { decrement: leaveRequest.totalDays } },
          });
        }
      }

      // Update leave request
      return tx.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: input.status,
          approvedBy: approverId,
          approvedAt: new Date(),
          approverComments: input.comments,
        },
      });
    });

    // Send notification
    const employeeUserId = leaveRequest.employee.user.id;
    const employeeEmail = leaveRequest.employee.user.email;
    const employeeName = getFullName(
      leaveRequest.employee.firstName,
      leaveRequest.employee.lastName
    );

    if (input.status === LeaveStatus.APPROVED) {
      await notificationService.notifyLeaveApproved(
        employeeUserId,
        leaveRequest.leaveType.name
      );

      await emailService.sendLeaveApprovedEmail({
        to: employeeEmail,
        employeeName,
        leaveType: leaveRequest.leaveType.name,
        startDate: formatDate(leaveRequest.startDate),
        endDate: formatDate(leaveRequest.endDate),
        approverName: "Your Manager", // Could fetch actual name
      });
    } else {
      await notificationService.notifyLeaveRejected(
        employeeUserId,
        leaveRequest.leaveType.name,
        input.comments
      );

      await emailService.sendLeaveRejectedEmail({
        to: employeeEmail,
        employeeName,
        leaveType: leaveRequest.leaveType.name,
        startDate: formatDate(leaveRequest.startDate),
        endDate: formatDate(leaveRequest.endDate),
        approverName: "Your Manager",
        reason: input.comments,
      });
    }

    return result;
  }

  async cancelLeave(
    employeeId: string,
    leaveRequestId: string,
    input: CancelLeaveInput
  ) {
    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        employeeId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundError(ERROR_MESSAGES.LEAVE_NOT_FOUND);
    }

    // Cannot cancel if leave has already started
    if (
      leaveRequest.status === LeaveStatus.APPROVED &&
      leaveRequest.startDate <= new Date()
    ) {
      throw new BadRequestError("Cannot cancel leave that has already started");
    }

    return prisma.$transaction(async (tx) => {
      // Restore leave balance
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year: leaveRequest.startDate.getFullYear(),
          },
        },
      });

      if (balance) {
        if (leaveRequest.status === LeaveStatus.APPROVED) {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: { used: { decrement: leaveRequest.totalDays } },
          });
        } else {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: { pending: { decrement: leaveRequest.totalDays } },
          });
        }
      }

      // Update leave request
      return tx.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: LeaveStatus.CANCELLED,
          cancelledBy: employeeId,
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        },
      });
    });
  }

  async getLeaveBalances(companyId: string, employeeId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    const leaveTypes = await prisma.companyLeaveType.findMany({
      where: { companyId, isActive: true },
    });

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId, year: targetYear },
      include: {
        leaveType: { select: { name: true, code: true } },
      },
    });

    const balanceMap = new Map(balances.map((b) => [b.leaveTypeId, b]));

    return leaveTypes.map((lt) => {
      const balance = balanceMap.get(lt.id);
      const allocated = balance?.allocated ?? lt.defaultBalance;
      const carryForward = balance?.carryForward ?? 0;
      const adjustment = balance?.adjustment ?? 0;
      const used = balance?.used ?? 0;
      const pending = balance?.pending ?? 0;
      const available = allocated + carryForward + adjustment - used - pending;

      return {
        leaveTypeId: lt.id,
        leaveTypeName: lt.name,
        leaveTypeCode: lt.code,
        year: targetYear,
        allocated,
        carryForward,
        adjustment,
        used,
        pending,
        available,
      };
    });
  }

  async adjustBalance(
    companyId: string,
    employeeId: string,
    input: AdjustBalanceInput
  ) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      throw new NotFoundError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    const year = new Date().getFullYear();

    return prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId: input.leaveTypeId,
          year,
        },
      },
      create: {
        employeeId,
        leaveTypeId: input.leaveTypeId,
        year,
        adjustment: input.adjustment,
      },
      update: {
        adjustment: { increment: input.adjustment },
      },
    });
  }

  async getLeaveCalendar(
    companyId: string,
    month: number,
    year: number,
    departmentId?: string
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const requests = await prisma.leaveRequest.findMany({
      where: {
        employee: {
          companyId,
          ...(departmentId ? { departmentId } : {}),
        },
        status: LeaveStatus.APPROVED,
        OR: [{ startDate: { lte: endDate }, endDate: { gte: startDate } }],
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        },
        leaveType: { select: { name: true, code: true } },
      },
    });

    return requests;
  }

  private async markAttendanceAsLeave(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    employeeId: string,
    startDate: Date,
    endDate: Date
  ) {
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      await tx.attendanceLog.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: new Date(currentDate),
          },
        },
        create: {
          employeeId,
          date: new Date(currentDate),
          status: AttendanceStatus.ON_LEAVE,
        },
        update: {
          status: AttendanceStatus.ON_LEAVE,
        },
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
}

export const leaveService = new LeaveService();
