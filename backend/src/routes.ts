import { Router } from "express";
import { API_VERSION } from "./shared/constants";

// Import route modules
import authRoutes from "./modules/auth/auth.routes";
import companyRoutes from "./modules/company/company.routes";
import employeeRoutes from "./modules/employee/employee.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import leaveRoutes from "./modules/leave/leave.routes";
import payrollRoutes from "./modules/payroll/payroll.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import reportRoutes from "./modules/reports/reports.routes";

const router = Router();

/**
 * API Routes
 * All routes are prefixed with /api/v1
 */

// Auth routes
router.use("/auth", authRoutes);

// Company & organization management
router.use("/company", companyRoutes);

// Employee management
router.use("/employees", employeeRoutes);

// Attendance & time tracking
router.use("/attendance", attendanceRoutes);

// Leave management
router.use("/leave", leaveRoutes);

// Payroll
router.use("/payroll", payrollRoutes);

// Notifications
router.use("/notifications", notificationRoutes);

// Reports & analytics
router.use("/reports", reportRoutes);

export default router;
