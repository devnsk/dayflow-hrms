import { prisma } from "../../prisma/client";
import { NotificationType } from "@prisma/client";
import { NotFoundError } from "../../shared/utils/errors";
import { PaginationParams } from "../../shared/types";
import { calculateOffset } from "../../shared/utils/helpers";

class NotificationService {
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: (data.data as object) || {},
      },
    });
  }

  async getByUser(
    userId: string,
    pagination: PaginationParams,
    unreadOnly: boolean = false
  ): Promise<{
    notifications: Array<{
      id: string;
      type: NotificationType;
      title: string;
      message: string;
      data: unknown;
      isRead: boolean;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: calculateOffset(pagination.page, pagination.limit),
        take: pagination.limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          data: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async deleteRead(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
    return result.count;
  }

  async notifyLeaveRequest(
    managerId: string,
    employeeName: string,
    leaveType: string
  ): Promise<void> {
    await this.create({
      userId: managerId,
      type: NotificationType.LEAVE_REQUEST,
      title: "New Leave Request",
      message: `${employeeName} has submitted a ${leaveType} request`,
    });
  }

  async notifyLeaveApproved(
    employeeUserId: string,
    leaveType: string
  ): Promise<void> {
    await this.create({
      userId: employeeUserId,
      type: NotificationType.LEAVE_APPROVED,
      title: "Leave Approved",
      message: `Your ${leaveType} request has been approved`,
    });
  }

  async notifyLeaveRejected(
    employeeUserId: string,
    leaveType: string,
    reason?: string
  ): Promise<void> {
    await this.create({
      userId: employeeUserId,
      type: NotificationType.LEAVE_REJECTED,
      title: "Leave Rejected",
      message: reason
        ? `Your ${leaveType} request was rejected: ${reason}`
        : `Your ${leaveType} request has been rejected`,
    });
  }

  async notifyPayrollGenerated(
    employeeUserId: string,
    month: string,
    year: number
  ): Promise<void> {
    await this.create({
      userId: employeeUserId,
      type: NotificationType.PAYROLL_GENERATED,
      title: "Payslip Available",
      message: `Your payslip for ${month} ${year} is now available`,
    });
  }

  async sendSystemAlert(
    userId: string,
    title: string,
    message: string
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.SYSTEM_ALERT,
      title,
      message,
    });
  }
}

export const notificationService = new NotificationService();
