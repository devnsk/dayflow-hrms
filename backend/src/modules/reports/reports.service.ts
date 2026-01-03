import { prisma } from "../../prisma/client";
import { EmployeeStatus, AttendanceStatus, LeaveStatus } from "@prisma/client";
import { DashboardStats } from "../../shared/types";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from "../../shared/utils/helpers";
import dayjs from "dayjs";

class ReportsService {
  async getDashboardStats(companyId: string): Promise<DashboardStats> {
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Get employee counts
    const [totalEmployees, activeEmployees] = await Promise.all([
      prisma.employee.count({ where: { companyId, deletedAt: null } }),
      prisma.employee.count({
        where: { companyId, status: EmployeeStatus.ACTIVE, deletedAt: null },
      }),
    ]);

    // Get today's attendance
    const todayAttendance = await prisma.attendanceLog.groupBy({
      by: ["status"],
      where: {
        employee: { companyId },
        date: today,
      },
      _count: true,
    });

    const attendanceMap = new Map(
      todayAttendance.map((a) => [a.status, a._count])
    );
    const present = attendanceMap.get(AttendanceStatus.PRESENT) || 0;
    const halfDay = attendanceMap.get(AttendanceStatus.HALF_DAY) || 0;
    const onLeave = attendanceMap.get(AttendanceStatus.ON_LEAVE) || 0;
    const absent = attendanceMap.get(AttendanceStatus.ABSENT) || 0;

    // Get late count
    const lateCount = await prisma.attendanceLog.count({
      where: {
        employee: { companyId },
        date: today,
        isLate: true,
      },
    });

    // Get on leave today
    const onLeaveToday = await prisma.leaveRequest.count({
      where: {
        employee: { companyId },
        status: LeaveStatus.APPROVED,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    // Get pending leave requests
    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: {
        employee: { companyId },
        status: LeaveStatus.PENDING,
      },
    });

    // Get upcoming birthdays (next 30 days)
    const thirtyDaysFromNow = dayjs().add(30, "day").toDate();
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        status: EmployeeStatus.ACTIVE,
        deletedAt: null,
        dateOfBirth: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
      },
    });

    const upcomingBirthdays = employees
      .filter((emp) => {
        if (!emp.dateOfBirth) return false;
        const birthday = dayjs(emp.dateOfBirth).year(dayjs().year());
        if (birthday.isBefore(today)) {
          birthday.add(1, "year");
        }
        return (
          birthday.isBefore(thirtyDaysFromNow) &&
          birthday.isAfter(dayjs().subtract(1, "day"))
        );
      })
      .map((emp) => ({
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        date: emp.dateOfBirth!,
      }))
      .slice(0, 5);

    // Get recent joiners (last 30 days)
    const thirtyDaysAgo = dayjs().subtract(30, "day").toDate();
    const recentJoiners = await prisma.employee.findMany({
      where: {
        companyId,
        deletedAt: null,
        joiningDate: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        joiningDate: true,
        department: { select: { name: true } },
      },
      orderBy: { joiningDate: "desc" },
      take: 5,
    });

    return {
      totalEmployees,
      activeEmployees,
      onLeaveToday,
      pendingLeaveRequests,
      attendanceToday: {
        present: present + halfDay,
        absent:
          absent + (activeEmployees - present - halfDay - onLeave - absent),
        late: lateCount,
      },
      upcomingBirthdays,
      recentJoiners: recentJoiners.map((j) => ({
        id: j.id,
        name: `${j.firstName} ${j.lastName}`,
        department: j.department?.name || "N/A",
        joiningDate: j.joiningDate,
      })),
    };
  }

  async getAttendanceReport(
    companyId: string,
    startDate: Date,
    endDate: Date,
    departmentId?: string
  ) {
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        deletedAt: null,
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

    // Group by employee
    const report = employees.map((employee) => {
      const empAttendance = attendance.filter(
        (a) => a.employeeId === employee.id
      );

      let present = 0;
      let absent = 0;
      let halfDays = 0;
      let late = 0;
      let onLeave = 0;
      let totalWorkHours = 0;

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
          case AttendanceStatus.ON_LEAVE:
            onLeave++;
            break;
        }
        if (record.isLate) late++;
        if (record.workHours) totalWorkHours += record.workHours;
      }

      return {
        employee: {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          code: employee.employeeCode,
          department: employee.department?.name,
        },
        present,
        absent,
        halfDays,
        late,
        onLeave,
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        averageWorkHours:
          empAttendance.length > 0
            ? Math.round((totalWorkHours / empAttendance.length) * 100) / 100
            : 0,
      };
    });

    return {
      period: { startDate, endDate },
      report,
      summary: {
        totalEmployees: employees.length,
        avgPresent:
          report.length > 0
            ? Math.round(
                report.reduce((sum, r) => sum + r.present, 0) / report.length
              )
            : 0,
        avgAbsent:
          report.length > 0
            ? Math.round(
                report.reduce((sum, r) => sum + r.absent, 0) / report.length
              )
            : 0,
      },
    };
  }

  async getLeaveReport(
    companyId: string,
    startDate: Date,
    endDate: Date,
    departmentId?: string
  ) {
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        employee: {
          companyId,
          ...(departmentId ? { departmentId } : {}),
        },
        startDate: { gte: startDate },
        endDate: { lte: endDate },
      },
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
        leaveType: { select: { name: true, code: true } },
      },
      orderBy: { startDate: "desc" },
    });

    // Group by leave type
    const byLeaveType = await prisma.leaveRequest.groupBy({
      by: ["leaveTypeId"],
      where: {
        employee: { companyId },
        startDate: { gte: startDate },
        endDate: { lte: endDate },
        status: LeaveStatus.APPROVED,
      },
      _sum: { totalDays: true },
      _count: true,
    });

    const leaveTypes = await prisma.companyLeaveType.findMany({
      where: { id: { in: byLeaveType.map((l) => l.leaveTypeId) } },
      select: { id: true, name: true },
    });

    const leaveTypeMap = new Map(leaveTypes.map((lt) => [lt.id, lt.name]));

    // Group by status
    const byStatus = await prisma.leaveRequest.groupBy({
      by: ["status"],
      where: {
        employee: { companyId },
        startDate: { gte: startDate },
        endDate: { lte: endDate },
      },
      _count: true,
    });

    return {
      period: { startDate, endDate },
      requests: leaveRequests.map((r) => ({
        id: r.id,
        employee: {
          id: r.employee.id,
          name: `${r.employee.firstName} ${r.employee.lastName}`,
          code: r.employee.employeeCode,
          department: r.employee.department?.name,
        },
        leaveType: r.leaveType.name,
        startDate: r.startDate,
        endDate: r.endDate,
        totalDays: r.totalDays,
        status: r.status,
        reason: r.reason,
      })),
      summary: {
        totalRequests: leaveRequests.length,
        byLeaveType: byLeaveType.map((l) => ({
          leaveType: leaveTypeMap.get(l.leaveTypeId) || "Unknown",
          totalDays: l._sum.totalDays || 0,
          count: l._count,
        })),
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
      },
    };
  }

  async getPayrollReport(companyId: string, month: number, year: number) {
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { companyId_month_year: { companyId, month, year } },
      include: {
        items: {
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
        },
      },
    });

    if (!payrollRun) {
      return null;
    }

    // Group by department
    const byDepartment = payrollRun.items.reduce(
      (acc, item) => {
        const dept = item.employee.department?.name || "Unassigned";
        if (!acc[dept]) {
          acc[dept] = { gross: 0, deductions: 0, net: 0, count: 0 };
        }
        acc[dept].gross += item.grossEarnings;
        acc[dept].deductions += item.totalDeductions;
        acc[dept].net += item.netSalary;
        acc[dept].count++;
        return acc;
      },
      {} as Record<
        string,
        { gross: number; deductions: number; net: number; count: number }
      >
    );

    return {
      month,
      year,
      status: payrollRun.status,
      totals: {
        employees: payrollRun.totalEmployees,
        gross: payrollRun.totalGross,
        deductions: payrollRun.totalDeductions,
        net: payrollRun.totalNet,
      },
      byDepartment: Object.entries(byDepartment).map(([dept, data]) => ({
        department: dept,
        ...data,
      })),
      items: payrollRun.items.map((item) => ({
        employee: {
          id: item.employee.id,
          name: `${item.employee.firstName} ${item.employee.lastName}`,
          code: item.employee.employeeCode,
          department: item.employee.department?.name,
        },
        daysPresent: item.daysPresent,
        daysAbsent: item.daysAbsent,
        grossEarnings: item.grossEarnings,
        totalDeductions: item.totalDeductions,
        netSalary: item.netSalary,
      })),
    };
  }

  async getEmployeeLifecycleReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const joiners = await prisma.employee.findMany({
      where: {
        companyId,
        joiningDate: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        joiningDate: true,
        employmentType: true,
        department: { select: { name: true } },
      },
      orderBy: { joiningDate: "desc" },
    });

    const exits = await prisma.employee.findMany({
      where: {
        companyId,
        status: { in: [EmployeeStatus.RESIGNED, EmployeeStatus.TERMINATED] },
        lastWorkingDate: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        status: true,
        lastWorkingDate: true,
        exitReason: true,
        department: { select: { name: true } },
      },
      orderBy: { lastWorkingDate: "desc" },
    });

    const headcountByStatus = await prisma.employee.groupBy({
      by: ["status"],
      where: { companyId, deletedAt: null },
      _count: true,
    });

    const headcountByDepartment = await prisma.employee.groupBy({
      by: ["departmentId"],
      where: { companyId, status: EmployeeStatus.ACTIVE, deletedAt: null },
      _count: true,
    });

    const departments = await prisma.department.findMany({
      where: {
        id: {
          in: headcountByDepartment
            .map((h) => h.departmentId)
            .filter(Boolean) as string[],
        },
      },
      select: { id: true, name: true },
    });

    const deptMap = new Map(departments.map((d) => [d.id, d.name]));

    return {
      period: { startDate, endDate },
      joiners: {
        count: joiners.length,
        list: joiners.map((j) => ({
          id: j.id,
          name: `${j.firstName} ${j.lastName}`,
          code: j.employeeCode,
          department: j.department?.name,
          joiningDate: j.joiningDate,
          employmentType: j.employmentType,
        })),
      },
      exits: {
        count: exits.length,
        list: exits.map((e) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          code: e.employeeCode,
          department: e.department?.name,
          lastWorkingDate: e.lastWorkingDate,
          status: e.status,
          reason: e.exitReason,
        })),
      },
      headcountByStatus: headcountByStatus.map((h) => ({
        status: h.status,
        count: h._count,
      })),
      headcountByDepartment: headcountByDepartment.map((h) => ({
        department: h.departmentId
          ? deptMap.get(h.departmentId) || "Unknown"
          : "Unassigned",
        count: h._count,
      })),
      attritionRate:
        joiners.length > 0
          ? Math.round((exits.length / (joiners.length + exits.length)) * 100)
          : 0,
    };
  }
}

export const reportsService = new ReportsService();
