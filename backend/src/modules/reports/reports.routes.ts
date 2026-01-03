import { Router } from "express";
import { reportsController } from "./reports.controller";
import {
  asyncHandler,
  authenticate,
  requireCompanyAdmin,
  requireManager,
  exportRateLimiter,
} from "../../shared/middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/dashboard",
  asyncHandler(reportsController.getDashboard.bind(reportsController))
);

/**
 * @swagger
 * /reports/attendance:
 *   get:
 *     summary: Get attendance report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 */
router.get(
  "/attendance",
  requireManager,
  exportRateLimiter,
  asyncHandler(reportsController.getAttendanceReport.bind(reportsController))
);

/**
 * @swagger
 * /reports/leave:
 *   get:
 *     summary: Get leave report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/leave",
  requireManager,
  exportRateLimiter,
  asyncHandler(reportsController.getLeaveReport.bind(reportsController))
);

/**
 * @swagger
 * /reports/payroll:
 *   get:
 *     summary: Get payroll report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/payroll",
  requireCompanyAdmin,
  exportRateLimiter,
  asyncHandler(reportsController.getPayrollReport.bind(reportsController))
);

/**
 * @swagger
 * /reports/employee-lifecycle:
 *   get:
 *     summary: Get employee lifecycle report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/employee-lifecycle",
  requireCompanyAdmin,
  exportRateLimiter,
  asyncHandler(
    reportsController.getEmployeeLifecycleReport.bind(reportsController)
  )
);

export default router;
