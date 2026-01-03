import { Router } from "express";
import { leaveController } from "./leave.controller";
import {
  asyncHandler,
  authenticate,
  requireCompanyAdmin,
  requireManager,
  validateBody,
  validateParams,
  validateQuery,
} from "../../shared/middleware";
import { idParamSchema, employeeIdParamSchema } from "../../shared/validators";
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  applyLeaveSchema,
  leaveActionSchema,
  cancelLeaveSchema,
  adjustBalanceSchema,
  leaveListQuerySchema,
  leaveBalanceQuerySchema,
} from "./leave.validators";

const router = Router();

router.use(authenticate);

router.get(
  "/types",
  asyncHandler(leaveController.listLeaveTypes.bind(leaveController))
);

router.post(
  "/types",
  requireCompanyAdmin,
  validateBody(createLeaveTypeSchema),
  asyncHandler(leaveController.createLeaveType.bind(leaveController))
);

router.put(
  "/types/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  validateBody(updateLeaveTypeSchema),
  asyncHandler(leaveController.updateLeaveType.bind(leaveController))
);

router.delete(
  "/types/:id",
  requireCompanyAdmin,
  validateParams(idParamSchema),
  asyncHandler(leaveController.deleteLeaveType.bind(leaveController))
);

router.get(
  "/my/balances",
  validateQuery(leaveBalanceQuerySchema),
  asyncHandler(leaveController.getMyBalances.bind(leaveController))
);

router.get(
  "/my/requests",
  validateQuery(leaveListQuerySchema),
  asyncHandler(leaveController.getMyLeaveRequests.bind(leaveController))
);

router.post(
  "/apply",
  validateBody(applyLeaveSchema),
  asyncHandler(leaveController.applyLeave.bind(leaveController))
);

router.post(
  "/:id/cancel",
  validateParams(idParamSchema),
  validateBody(cancelLeaveSchema),
  asyncHandler(leaveController.cancelLeave.bind(leaveController))
);

router.get(
  "/pending",
  requireManager,
  asyncHandler(leaveController.getPendingForManager.bind(leaveController))
);

router.get(
  "/requests",
  requireManager,
  validateQuery(leaveListQuerySchema),
  asyncHandler(leaveController.listLeaveRequests.bind(leaveController))
);

router.put(
  "/:id/action",
  requireManager,
  validateParams(idParamSchema),
  validateBody(leaveActionSchema),
  asyncHandler(leaveController.handleLeaveAction.bind(leaveController))
);

router.get(
  "/employees/:employeeId/balances",
  requireManager,
  validateParams(employeeIdParamSchema),
  validateQuery(leaveBalanceQuerySchema),
  asyncHandler(leaveController.getEmployeeBalances.bind(leaveController))
);

router.post(
  "/employees/:employeeId/adjust",
  requireCompanyAdmin,
  validateParams(employeeIdParamSchema),
  validateBody(adjustBalanceSchema),
  asyncHandler(leaveController.adjustBalance.bind(leaveController))
);

router.get(
  "/calendar",
  asyncHandler(leaveController.getLeaveCalendar.bind(leaveController))
);

export default router;
