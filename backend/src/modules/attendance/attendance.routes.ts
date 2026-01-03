import { Router } from "express";
import { attendanceController } from "./attendance.controller";
import {
  asyncHandler,
  authenticate,
  requireCompanyAdmin,
  requireManager,
  validateBody,
  validateParams,
  validateQuery,
} from "../../shared/middleware";
import { idParamSchema } from "../../shared/validators";
import {
  checkInSchema,
  checkOutSchema,
  manualAttendanceSchema,
  correctionRequestSchema,
  correctionActionSchema,
  attendanceListQuerySchema,
  monthlySummaryQuerySchema,
} from "./attendance.validators";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /attendance/check-in:
 *   post:
 *     summary: Check in for the day
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/check-in",
  validateBody(checkInSchema),
  asyncHandler(attendanceController.checkIn.bind(attendanceController))
);

/**
 * @swagger
 * /attendance/check-out:
 *   post:
 *     summary: Check out for the day
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/check-out",
  validateBody(checkOutSchema),
  asyncHandler(attendanceController.checkOut.bind(attendanceController))
);

/**
 * @swagger
 * /attendance/today:
 *   get:
 *     summary: Get today's attendance status
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/today",
  asyncHandler(
    attendanceController.getTodayAttendance.bind(attendanceController)
  )
);

/**
 * @swagger
 * /attendance/my-history:
 *   get:
 *     summary: Get my attendance history
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/my-history",
  asyncHandler(
    attendanceController.getMyAttendanceHistory.bind(attendanceController)
  )
);

/**
 * @swagger
 * /attendance/summary:
 *   get:
 *     summary: Get monthly attendance summary
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/summary",
  requireManager,
  validateQuery(monthlySummaryQuerySchema),
  asyncHandler(
    attendanceController.getMonthlySummary.bind(attendanceController)
  )
);

/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: List attendance records
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/",
  requireManager,
  validateQuery(attendanceListQuerySchema),
  asyncHandler(attendanceController.listAttendance.bind(attendanceController))
);

/**
 * @swagger
 * /attendance/manual:
 *   post:
 *     summary: Create manual attendance entry
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/manual",
  requireCompanyAdmin,
  validateBody(manualAttendanceSchema),
  asyncHandler(
    attendanceController.createManualAttendance.bind(attendanceController)
  )
);

/**
 * @swagger
 * /attendance/correction:
 *   post:
 *     summary: Submit attendance correction request
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/correction",
  validateBody(correctionRequestSchema),
  asyncHandler(
    attendanceController.submitCorrectionRequest.bind(attendanceController)
  )
);

/**
 * @swagger
 * /attendance/{id}/correction:
 *   put:
 *     summary: Approve or reject correction request
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:id/correction",
  requireManager,
  validateParams(idParamSchema),
  validateBody(correctionActionSchema),
  asyncHandler(
    attendanceController.handleCorrectionRequest.bind(attendanceController)
  )
);

export default router;
