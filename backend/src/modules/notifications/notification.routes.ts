import { Router } from "express";
import { notificationController } from "./notification.controller";
import {
  asyncHandler,
  authenticate,
  validateParams,
} from "../../shared/middleware";
import { idParamSchema } from "../../shared/validators";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get(
  "/",
  asyncHandler(
    notificationController.getNotifications.bind(notificationController)
  )
);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get(
  "/unread-count",
  asyncHandler(
    notificationController.getUnreadCount.bind(notificationController)
  )
);

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: All notifications marked as read
 */
router.put(
  "/read-all",
  asyncHandler(
    notificationController.markAllAsRead.bind(notificationController)
  )
);

/**
 * @swagger
 * /notifications/read:
 *   delete:
 *     summary: Delete all read notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted count
 */
router.delete(
  "/read",
  asyncHandler(
    notificationController.deleteReadNotifications.bind(notificationController)
  )
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Notification marked as read
 */
router.put(
  "/:id/read",
  validateParams(idParamSchema),
  asyncHandler(notificationController.markAsRead.bind(notificationController))
);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Notification deleted
 */
router.delete(
  "/:id",
  validateParams(idParamSchema),
  asyncHandler(
    notificationController.deleteNotification.bind(notificationController)
  )
);

export default router;
