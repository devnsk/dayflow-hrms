import { Response } from "express";
import { AuthRequest } from "../../shared/types";
import { authService } from "./auth.service";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "../../shared/utils/response";
import { SUCCESS_MESSAGES } from "../../shared/constants";
import { auditAction } from "../../shared/middleware";
import {
  LoginInput,
  CompanySignupInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  VerifyEmailInput,
  InviteEmployeeInput,
  AcceptInviteInput,
  RefreshTokenInput,
} from "./auth.validators";

export class AuthController {
  async login(req: AuthRequest, res: Response): Promise<Response> {
    const input = req.body as LoginInput;
    const result = await authService.login(input);

    await auditAction.login(req, result.user.id);

    return sendSuccess(res, result, SUCCESS_MESSAGES.LOGIN_SUCCESS);
  }

  async signup(req: AuthRequest, res: Response): Promise<Response> {
    const input = req.body as CompanySignupInput;
    const result = await authService.companySignup(input);

    return sendCreated(res, result, "Company registered successfully");
  }

  async forgotPassword(req: AuthRequest, res: Response): Promise<Response> {
    const input = req.body as ForgotPasswordInput;
    await authService.forgotPassword(input);

    return sendSuccess(res, null, SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL);
  }

  async resetPassword(req: AuthRequest, res: Response): Promise<Response> {
    const input = req.body as ResetPasswordInput;
    await authService.resetPassword(input);

    return sendSuccess(res, null, SUCCESS_MESSAGES.PASSWORD_UPDATED);
  }

  async changePassword(req: AuthRequest, res: Response): Promise<Response> {
    const input = req.body as ChangePasswordInput;
    await authService.changePassword(req.user!.id, input);

    return sendSuccess(res, null, SUCCESS_MESSAGES.PASSWORD_UPDATED);
  }

  async verifyEmail(req: AuthRequest, res: Response): Promise<Response> {
    const input = req.body as VerifyEmailInput;
    await authService.verifyEmail(input.token);

    return sendSuccess(res, null, SUCCESS_MESSAGES.EMAIL_VERIFIED);
  }

  async inviteEmployee(req: AuthRequest, res: Response): Promise<Response> {
    const input = req.body as InviteEmployeeInput;
    const result = await authService.inviteEmployee(
      req.user!.companyId!,
      req.user!.id,
      input
    );

    return sendCreated(res, result, SUCCESS_MESSAGES.INVITE_SENT);
  }

  async acceptInvite(req: AuthRequest, res: Response): Promise<Response> {
    const input = req.body as AcceptInviteInput;
    const result = await authService.acceptInvite(input);

    return sendCreated(res, result, "Welcome! Your account has been created.");
  }

  async refreshToken(req: AuthRequest, res: Response): Promise<Response> {
    const input = req.body as RefreshTokenInput;
    const result = await authService.refreshToken(input.refreshToken);

    return sendSuccess(res, result);
  }

  async logout(req: AuthRequest, res: Response): Promise<Response> {
    await authService.logout(req.user!.id);

    await auditAction.logout(req, req.user!.id);

    return sendNoContent(res);
  }

  async getProfile(req: AuthRequest, res: Response): Promise<Response> {
    const profile = await authService.getProfile(req.user!.id);

    return sendSuccess(res, profile);
  }
}

export const authController = new AuthController();
