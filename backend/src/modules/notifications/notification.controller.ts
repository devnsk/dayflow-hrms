import { Response } from "express";
import { AuthRequest } from "../../shared/types";
import { notificationService } from "./notification.service";
import {
  sendSuccess,
  sendNoContent,
  sendPaginated,
} from "../../shared/utils/response";
import { parsePaginationParams } from "../../shared/utils/helpers";

class NotificationController {
  async getNotifications(req: AuthRequest, res: Response): Promise<Response> {
    const pagination = parsePaginationParams(
      req.query as Record<string, unknown>
    );
    const unreadOnly = req.query.unreadOnly === "true";

    const { notifications, total } = await notificationService.getByUser(
      req.user!.id,
      pagination,
      unreadOnly
    );

    return sendPaginated(
      res,
      notifications,
      total,
      pagination.page,
      pagination.limit
    );
  }

  async getUnreadCount(req: AuthRequest, res: Response): Promise<Response> {
    const count = await notificationService.getUnreadCount(req.user!.id);

    return sendSuccess(res, { count });
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<Response> {
    await notificationService.markAsRead(req.params.id, req.user!.id);

    return sendNoContent(res);
  }

  async markAllAsRead(req: AuthRequest, res: Response): Promise<Response> {
    await notificationService.markAllAsRead(req.user!.id);

    return sendNoContent(res);
  }

  async deleteNotification(req: AuthRequest, res: Response): Promise<Response> {
    await notificationService.delete(req.params.id, req.user!.id);

    return sendNoContent(res);
  }

  async deleteReadNotifications(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const count = await notificationService.deleteRead(req.user!.id);

    return sendSuccess(res, { deletedCount: count });
  }
}

export const notificationController = new NotificationController();
