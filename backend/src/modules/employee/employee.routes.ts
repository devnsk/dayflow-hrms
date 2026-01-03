import { Router } from "express";
import { employeeController } from "./employee.controller";
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
  createEmployeeSchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
  createSalaryStructureSchema,
  employeeListQuerySchema,
} from "./employee.validators";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /employees/me:
 *   get:
 *     summary: Get current employee's profile
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/me",
  asyncHandler(employeeController.getMyProfile.bind(employeeController))
);

/**
 * @swagger
 * /employees/org-hierarchy:
 *   get:
 *     summary: Get organization hierarchy
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/org-hierarchy",
  asyncHandler(employeeController.getOrgHierarchy.bind(employeeController))
);

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: List employees with filters
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/",
  validateQuery(employeeListQuerySchema),
  asyncHandler(employeeController.listEmployees.bind(employeeController))
);

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  requireCompanyAdmin,
  validateBody(createEmployeeSchema),
  asyncHandler(employeeController.createEmployee.bind(employeeController))
);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id",
  validateParams(idParamSchema),
  asyncHandler(employeeController.getEmployee.bind(employeeController))
);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(updateEmployeeSchema),
  asyncHandler(employeeController.updateEmployee.bind(employeeController))
);

/**
 * @swagger
 * /employees/{id}/status:
 *   patch:
 *     summary: Update employee status
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:id/status",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(updateEmployeeStatusSchema),
  asyncHandler(employeeController.updateEmployeeStatus.bind(employeeController))
);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  asyncHandler(employeeController.deleteEmployee.bind(employeeController))
);

/**
 * @swagger
 * /employees/{id}/direct-reports:
 *   get:
 *     summary: Get employee's direct reports
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id/direct-reports",
  validateParams(idParamSchema),
  asyncHandler(employeeController.getDirectReports.bind(employeeController))
);

/**
 * @swagger
 * /employees/{id}/salary:
 *   get:
 *     summary: Get employee's salary structure
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id/salary",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  asyncHandler(employeeController.getSalaryStructure.bind(employeeController))
);

/**
 * @swagger
 * /employees/{id}/salary:
 *   put:
 *     summary: Create or update employee's salary structure
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:id/salary",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(createSalaryStructureSchema),
  asyncHandler(
    employeeController.upsertSalaryStructure.bind(employeeController)
  )
);

export default router;
