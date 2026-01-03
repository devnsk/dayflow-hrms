import { prisma } from "../../prisma/client";
import { AttendanceStatus, LeaveStatus } from "@prisma/client";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../../shared/utils/errors";
import { ERROR_MESSAGES, ATTENDANCE_SETTINGS } from "../../shared/constants";
import { PaginationParams, AttendanceFilters } from "../../shared/types";
import {
  calculateOffset,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  calculateWorkHours,
  timeToMinutes,
  isWeekend,
} from "../../shared/utils/helpers";
import {
  CheckInInput,
  CheckOutInput,
  ManualAttendanceInput,
  CorrectionRequestInput,
  CorrectionActionInput,
} from "./attendance.validators";
import dayjs from "dayjs";

class AttendanceService {
  async checkIn(
    companyId: string,
    employeeId: string,
    input: CheckInInput,
    ipAddress?: string
  ) {
    const today = startOfDay(new Date());

    const existing = await prisma.attendanceLog.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (existing && existing.checkIn) {
      throw new ConflictError(ERROR_MESSAGES.ALREADY_CHECKED_IN);
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { shift: true },
    });

    if (!employee) {
      throw new NotFoundError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    const now = new Date();
    const shift = employee.shift;
    let isLate = false;
    let lateMinutes = 0;

    if (shift) {
      const shiftStartMinutes = timeToMinutes(shift.startTime);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const graceMinutes =
        shift.graceMinutes || ATTENDANCE_SETTINGS.GRACE_PERIOD_MINUTES;

      if (currentMinutes > shiftStartMinutes + graceMinutes) {
        isLate = true;
        lateMinutes = currentMinutes - shiftStartMinutes;
      }
    }

    if (existing) {
      return prisma.attendanceLog.update({
        where: { id: existing.id },
        data: {
          checkIn: now,
          isLate,
          lateMinutes,
          status: AttendanceStatus.PRESENT,
          notes: input.notes,
          ipAddress,
          location: (input.location as object) || undefined,
        },
      });
    }

    return prisma.attendanceLog.create({
      data: {
        employeeId,
        date: today,
        checkIn: now,
        isLate,
        lateMinutes,
        status: AttendanceStatus.PRESENT,
        notes: input.notes,
        ipAddress,
        location: (input.location as object) || undefined,
      },
    });
  }

  async checkOut(companyId: string, employeeId: string, input: CheckOutInput) {
    const today = startOfDay(new Date());

    const attendance = await prisma.attendanceLog.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!attendance || !attendance.checkIn) {
      throw new BadRequestError(ERROR_MESSAGES.NOT_CHECKED_IN);
    }

    if (attendance.checkOut) {
      throw new ConflictError(ERROR_MESSAGES.ALREADY_CHECKED_OUT);
    }

    const now = new Date();

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { shift: true },
    });

    const shift = employee?.shift;
    let isEarlyExit = false;
    let earlyExitMinutes = 0;
    let overtimeMinutes = 0;

    if (shift) {
      const shiftEndMinutes = timeToMinutes(shift.endTime);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      if (currentMinutes < shiftEndMinutes) {
        isEarlyExit = true;
        earlyExitMinutes = shiftEndMinutes - currentMinutes;
      } else if (currentMinutes > shiftEndMinutes + 30) {
        overtimeMinutes = currentMinutes - shiftEndMinutes;
      }
    }

    const breakMinutes =
      shift?.breakDuration || ATTENDANCE_SETTINGS.DEFAULT_BREAK_MINUTES;
    const workHours = calculateWorkHours(attendance.checkIn, now, breakMinutes);

    const status =
      workHours < ATTENDANCE_SETTINGS.HALF_DAY_HOURS
        ? AttendanceStatus.HALF_DAY
        : AttendanceStatus.PRESENT;

    return prisma.attendanceLog.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        workHours,
        breakMinutes,
        isEarlyExit,
        earlyExitMinutes,
        overtimeMinutes,
        status,
        notes: input.notes
          ? `${attendance.notes || ""} ${input.notes}`.trim()
          : attendance.notes,
      },
    });
  }

  async getTodayAttendance(employeeId: string) {
    const today = startOfDay(new Date());

    return prisma.attendanceLog.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });
  }

  async listAttendance(
    companyId: string,
    pagination: PaginationParams,
    filters: AttendanceFilters
  ) {
    const employees = filters.departmentId
      ? await prisma.employee.findMany({
          where: { companyId, departmentId: filters.departmentId },
          select: { id: true },
        })
      : null;

    const where = {
      employee: { companyId },
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(employees ? { employeeId: { in: employees.map((e) => e.id) } } : {}),
      ...(filters.status ? { status: filters.status as AttendanceStatus } : {}),
      ...(filters.date ? { date: filters.date } : {}),
      ...(filters.startDate && filters.endDate
        ? { date: { gte: filters.startDate, lte: filters.endDate } }
        : {}),
    };

    const [records, total] = await Promise.all([
      prisma.attendanceLog.findMany({
        where,
        orderBy: [{ date: "desc" }, { checkIn: "desc" }],
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
        },
      }),
      prisma.attendanceLog.count({ where }),
    ]);

    return { records, total };
  }

  async createManualAttendance(
    companyId: string,
    input: ManualAttendanceInput
  ) {
    const employee = await prisma.employee.findFirst({
      where: { id: input.employeeId, companyId },
    });

    if (!employee) {
      throw new NotFoundError(ERROR_MESSAGES.EMPLOYEE_NOT_FOUND);
    }

    const date = startOfDay(input.date);

    const existing = await prisma.attendanceLog.findUnique({
      where: { employeeId_date: { employeeId: input.employeeId, date } },
    });

    if (existing) {
      throw new ConflictError("Attendance record already exists for this date");
    }

    const [checkInHour, checkInMin] = input.checkIn.split(":").map(Number);
    const checkIn = new Date(date);
    checkIn.setHours(checkInHour, checkInMin, 0, 0);

    let checkOut: Date | undefined;
    let workHours: number | undefined;

    if (input.checkOut) {
      const [checkOutHour, checkOutMin] = input.checkOut.split(":").map(Number);
      checkOut = new Date(date);
      checkOut.setHours(checkOutHour, checkOutMin, 0, 0);
      workHours = calculateWorkHours(
        checkIn,
        checkOut,
        ATTENDANCE_SETTINGS.DEFAULT_BREAK_MINUTES
      );
    }

    return prisma.attendanceLog.create({
      data: {
        employeeId: input.employeeId,
        date,
        checkIn,
        checkOut,
        workHours,
        status: input.status,
        notes: input.notes,
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true },
        },
      },
    });
  }

  async submitCorrectionRequest(
    employeeId: string,
    input: CorrectionRequestInput
  ) {
    const date = startOfDay(input.date);

    const attendance = await prisma.attendanceLog.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });

    if (!attendance) {
      throw new NotFoundError("No attendance record found for this date");
    }

    if (
      attendance.isCorrectionRequest &&
      attendance.correctionStatus === LeaveStatus.PENDING
    ) {
      throw new ConflictError(
        "A correction request is already pending for this date"
      );
    }

    return prisma.attendanceLog.update({
      where: { id: attendance.id },
      data: {
        isCorrectionRequest: true,
        correctionStatus: LeaveStatus.PENDING,
        correctionReason: input.reason,
      },
    });
  }

  async handleCorrectionRequest(
    companyId: string,
    attendanceId: string,
    approverId: string,
    input: CorrectionActionInput
  ) {
    const attendance = await prisma.attendanceLog.findFirst({
      where: {
        id: attendanceId,
        employee: { companyId },
        isCorrectionRequest: true,
        correctionStatus: LeaveStatus.PENDING,
      },
    });

    if (!attendance) {
      throw new NotFoundError("Correction request not found");
    }

    return prisma.attendanceLog.update({
      where: { id: attendanceId },
      data: {
        correctionStatus: input.approved
          ? LeaveStatus.APPROVED
          : LeaveStatus.REJECTED,
        correctionApprovedBy: approverId,
        correctionApprovedAt: new Date(),
      },
    });
  }

  async getMonthlySummary(
    companyId: string,
    month: number,
    year: number,
    employeeId?: string,
    departmentId?: string
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(employeeId ? { id: employeeId } : {}),
        ...(departmentId ? { departmentId } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        department: { select: { name: true } },
      },
    });

    const attendance = await prisma.attendanceLog.findMany({
      where: {
        employeeId: { in: employees.map((e) => e.id) },
        date: { gte: startDate, lte: endDate },
      },
    });

    const holidays = await prisma.holiday.findMany({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { workingDays: true },
    });
    const workingDays = company?.workingDays || [1, 2, 3, 4, 5];

    const summaries = employees.map((employee) => {
      const empAttendance = attendance.filter(
        (a) => a.employeeId === employee.id
      );

      let totalWorkingDays = 0;
      let present = 0;
      let absent = 0;
      let halfDays = 0;
      let late = 0;
      let totalWorkHours = 0;

      for (
        let d = new Date(startDate);
        d <= endDate;
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

      for (const record of empAttendance) {
        switch (record.status) {
          case AttendanceStatus.PRESENT:
            present++;
            break;
          case AttendanceStatus.HALF_DAY:
            halfDays++;
            break;
          case AttendanceStatus.ABSENT:
            absent++;
            break;
        }

        if (record.isLate) late++;
        if (record.workHours) totalWorkHours += record.workHours;
      }

      absent = totalWorkingDays - present - halfDays;
      if (absent < 0) absent = 0;

      return {
        employee: {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.employeeCode,
          department: employee.department?.name,
        },
        totalWorkingDays,
        present,
        absent,
        halfDays,
        late,
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        attendancePercentage:
          totalWorkingDays > 0
            ? Math.round(((present + halfDays * 0.5) / totalWorkingDays) * 100)
            : 0,
      };
    });

    return {
      month,
      year,
      totalHolidays: holidays.length,
      summaries,
    };
  }
}

export const attendanceService = new AttendanceService();
