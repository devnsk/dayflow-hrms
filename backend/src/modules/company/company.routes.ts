import { Router } from "express";
import { companyController } from "./company.controller";
import {
  asyncHandler,
  authenticate,
  requireCompanyAdmin,
  validateBody,
  validateParams,
  validateQuery,
} from "../../shared/middleware";
import { idParamSchema } from "../../shared/validators";
import {
  updateCompanySchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createDesignationSchema,
  updateDesignationSchema,
  createLocationSchema,
  updateLocationSchema,
  createShiftSchema,
  updateShiftSchema,
  createHolidaySchema,
  updateHolidaySchema,
  listQuerySchema,
} from "./company.validators";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /company:
 *   get:
 *     summary: Get current company profile
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/",
  asyncHandler(companyController.getCompany.bind(companyController))
);

/**
 * @swagger
 * /company:
 *   put:
 *     summary: Update company profile
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/",
  requireCompanyAdmin,
  validateBody(updateCompanySchema),
  asyncHandler(companyController.updateCompany.bind(companyController))
);

router.get(
  "/departments",
  validateQuery(listQuerySchema),
  asyncHandler(companyController.listDepartments.bind(companyController))
);

router.post(
  "/departments",
  requireCompanyAdmin,
  validateBody(createDepartmentSchema),
  asyncHandler(companyController.createDepartment.bind(companyController))
);

router.get(
  "/departments/:id",
  validateParams(idParamSchema),
  asyncHandler(companyController.getDepartment.bind(companyController))
);

router.put(
  "/departments/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(updateDepartmentSchema),
  asyncHandler(companyController.updateDepartment.bind(companyController))
);

router.delete(
  "/departments/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  asyncHandler(companyController.deleteDepartment.bind(companyController))
);

router.get(
  "/designations",
  validateQuery(listQuerySchema),
  asyncHandler(companyController.listDesignations.bind(companyController))
);

router.post(
  "/designations",
  requireCompanyAdmin,
  validateBody(createDesignationSchema),
  asyncHandler(companyController.createDesignation.bind(companyController))
);

router.put(
  "/designations/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(updateDesignationSchema),
  asyncHandler(companyController.updateDesignation.bind(companyController))
);

router.delete(
  "/designations/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  asyncHandler(companyController.deleteDesignation.bind(companyController))
);

router.get(
  "/locations",
  validateQuery(listQuerySchema),
  asyncHandler(companyController.listLocations.bind(companyController))
);

router.post(
  "/locations",
  requireCompanyAdmin,
  validateBody(createLocationSchema),
  asyncHandler(companyController.createLocation.bind(companyController))
);

router.put(
  "/locations/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(updateLocationSchema),
  asyncHandler(companyController.updateLocation.bind(companyController))
);

router.delete(
  "/locations/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  asyncHandler(companyController.deleteLocation.bind(companyController))
);

router.get(
  "/shifts",
  asyncHandler(companyController.listShifts.bind(companyController))
);

router.post(
  "/shifts",
  requireCompanyAdmin,
  validateBody(createShiftSchema),
  asyncHandler(companyController.createShift.bind(companyController))
);

router.put(
  "/shifts/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(updateShiftSchema),
  asyncHandler(companyController.updateShift.bind(companyController))
);

router.delete(
  "/shifts/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  asyncHandler(companyController.deleteShift.bind(companyController))
);

router.get(
  "/holidays",
  asyncHandler(companyController.listHolidays.bind(companyController))
);

router.post(
  "/holidays",
  requireCompanyAdmin,
  validateBody(createHolidaySchema),
  asyncHandler(companyController.createHoliday.bind(companyController))
);

router.put(
  "/holidays/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(updateHolidaySchema),
  asyncHandler(companyController.updateHoliday.bind(companyController))
);

router.delete(
  "/holidays/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  asyncHandler(companyController.deleteHoliday.bind(companyController))
);

export default router;
