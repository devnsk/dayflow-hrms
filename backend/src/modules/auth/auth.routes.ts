import { Router } from "express";
import { authController } from "./auth.controller";
import {
  asyncHandler,
  authenticate,
  requireCompanyAdmin,
} from "../../shared/middleware";
import { validateBody } from "../../shared/middleware";
import {
  authRateLimiter,
  passwordResetRateLimiter,
} from "../../shared/middleware";
import {
  loginSchema,
  companySignupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  inviteEmployeeSchema,
  acceptInviteSchema,
  refreshTokenSchema,
} from "./auth.validators";

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(authController.login.bind(authController))
);

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Company signup with admin user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - companyEmail
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               companyName:
 *                 type: string
 *               companyEmail:
 *                 type: string
 *                 format: email
 *               companyPhone:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Company registered successfully
 *       409:
 *         description: User already exists
 */
router.post(
  "/signup",
  authRateLimiter,
  validateBody(companySignupSchema),
  asyncHandler(authController.signup.bind(authController))
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post(
  "/forgot-password",
  passwordResetRateLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword.bind(authController))
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password",
  passwordResetRateLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword.bind(authController))
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  asyncHandler(authController.verifyEmail.bind(authController))
);

/**
 * @swagger
 * /auth/accept-invite:
 *   post:
 *     summary: Accept invite and complete registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Invalid or expired invite token
 */
router.post(
  "/accept-invite",
  validateBody(acceptInviteSchema),
  asyncHandler(authController.acceptInvite.bind(authController))
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  asyncHandler(authController.refreshToken.bind(authController))
);

// Protected routes (require authentication)

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password for authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password is incorrect
 */
router.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword.bind(authController))
);

/**
 * @swagger
 * /auth/invite:
 *   post:
 *     summary: Invite employee to company
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [EMPLOYEE, MANAGER, COMPANY_ADMIN]
 *               departmentId:
 *                 type: string
 *               designationId:
 *                 type: string
 *               managerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invite sent successfully
 *       409:
 *         description: User already exists
 */
router.post(
  "/invite",
  authenticate,
  requireCompanyAdmin,
  validateBody(inviteEmployeeSchema),
  asyncHandler(authController.inviteEmployee.bind(authController))
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Logged out successfully
 */
router.post(
  "/logout",
  authenticate,
  asyncHandler(authController.logout.bind(authController))
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(authController.getProfile.bind(authController))
);

export default router;
