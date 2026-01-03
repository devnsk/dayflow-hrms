import { Router } from "express";
import { payrollController } from "./payroll.controller";
import {
  asyncHandler,
  authenticate,
  requireCompanyAdmin,
  validateBody,
  validateParams,
  validateQuery,
} from "../../shared/middleware";
import { idParamSchema, employeeIdParamSchema } from "../../shared/validators";
import {
  generatePayrollSchema,
  updatePayrollItemSchema,
  processPayrollSchema,
  markPaidSchema,
  payrollListQuerySchema,
  payrollItemsQuerySchema,
} from "./payroll.validators";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /payroll/my-payslips:
 *   get:
 *     summary: Get my payslips
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/my-payslips",
  asyncHandler(payrollController.getMyPayslips.bind(payrollController))
);

/**
 * @swagger
 * /payroll/payslips/{id}:
 *   get:
 *     summary: Get payslip details
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/payslips/:id",
  validateParams(idParamSchema),
  asyncHandler(payrollController.getPayslip.bind(payrollController))
);

/**
 * @swagger
 * /payroll/generate:
 *   post:
 *     summary: Generate payroll for a month
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/generate",
  requireCompanyAdmin,
  validateBody(generatePayrollSchema),
  asyncHandler(payrollController.generatePayroll.bind(payrollController))
);

/**
 * @swagger
 * /payroll:
 *   get:
 *     summary: List payroll runs
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/",
  requireCompanyAdmin,
  validateQuery(payrollListQuerySchema),
  asyncHandler(payrollController.listPayrollRuns.bind(payrollController))
);

/**
 * @swagger
 * /payroll/{id}:
 *   get:
 *     summary: Get payroll run details
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  asyncHandler(payrollController.getPayrollRun.bind(payrollController))
);

/**
 * @swagger
 * /payroll/{id}/items:
 *   get:
 *     summary: Get payroll items for a run
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id/items",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateQuery(payrollItemsQuerySchema),
  asyncHandler(payrollController.getPayrollItems.bind(payrollController))
);

/**
 * @swagger
 * /payroll/items/{id}:
 *   put:
 *     summary: Update payroll item
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/items/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(updatePayrollItemSchema),
  asyncHandler(payrollController.updatePayrollItem.bind(payrollController))
);

/**
 * @swagger
 * /payroll/{id}/process:
 *   post:
 *     summary: Process payroll run
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:id/process",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(processPayrollSchema),
  asyncHandler(payrollController.processPayroll.bind(payrollController))
);

/**
 * @swagger
 * /payroll/{id}/complete:
 *   post:
 *     summary: Complete payroll run
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:id/complete",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  asyncHandler(payrollController.completePayroll.bind(payrollController))
);

/**
 * @swagger
 * /payroll/{id}/mark-paid:
 *   post:
 *     summary: Mark payroll as paid
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:id/mark-paid",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(markPaidSchema),
  asyncHandler(payrollController.markPaid.bind(payrollController))
);

/**
 * @swagger
 * /payroll/employees/{employeeId}/payslips:
 *   get:
 *     summary: Get employee payslips
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/employees/:employeeId/payslips",
  requireCompanyAdmin,
  validateParams(employeeIdParamSchema),
  asyncHandler(payrollController.getEmployeePayslips.bind(payrollController))
);

export default router;
