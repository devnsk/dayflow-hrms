import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma, TransactionClient } from "../../prisma/client";
import { UserRole, UserStatus } from "@prisma/client";
import { TokenPayload, AuthUser } from "../../shared/types";
import {
  UnauthorizedError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../shared/utils/errors";
import { ERROR_MESSAGES, TOKEN_EXPIRY } from "../../shared/constants";
import { generateToken, generateSlug } from "../../shared/utils/helpers";
import { emailService } from "../notifications/email.service";
import {
  LoginInput,
  CompanySignupInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  InviteEmployeeInput,
  AcceptInviteInput,
} from "./auth.validators";

export class AuthService {
  private readonly saltRounds = 10;

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateAccessToken(payload: Omit<TokenPayload, "type">): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not configured");

    const expiresIn = (process.env.JWT_EXPIRES_IN ||
      TOKEN_EXPIRY.ACCESS_TOKEN) as jwt.SignOptions["expiresIn"];
    return jwt.sign({ ...payload, type: "access" }, secret, { expiresIn });
  }

  private generateRefreshToken(payload: Omit<TokenPayload, "type">): string {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");

    const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ||
      TOKEN_EXPIRY.REFRESH_TOKEN) as jwt.SignOptions["expiresIn"];
    return jwt.sign({ ...payload, type: "refresh" }, secret, { expiresIn });
  }

  private generateTokenPair(user: {
    id: string;
    email: string;
    role: UserRole;
    companyId: string | null;
  }) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  async login(input: LoginInput): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        employee: { select: { id: true } },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isValidPassword = await this.verifyPassword(
      input.password,
      user.passwordHash
    );
    if (!isValidPassword) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedError(ERROR_MESSAGES.ACCOUNT_INACTIVE);
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedError(ERROR_MESSAGES.ACCOUNT_SUSPENDED);
    }

    const tokens = this.generateTokenPair(user);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: tokens.refreshToken,
        lastLoginAt: new Date(),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        companyId: user.companyId,
        employeeId: user.employee?.id || null,
      },
      ...tokens,
    };
  }

  async companySignup(input: CompanySignupInput): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    companyId: string;
  }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError(ERROR_MESSAGES.USER_EXISTS);
    }

    let slug = generateSlug(input.companyName);
    const existingCompany = await prisma.company.findUnique({
      where: { slug },
    });
    if (existingCompany) {
      slug = `${slug}-${Date.now()}`;
    }

    const passwordHash = await this.hashPassword(input.password);

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const company = await tx.company.create({
        data: {
          name: input.companyName,
          slug,
          email: input.companyEmail,
          phone: input.companyPhone,
        },
      });

      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: UserRole.COMPANY_ADMIN,
          status: UserStatus.ACTIVE,
          emailVerified: false,
          companyId: company.id,
        },
      });

      const employee = await tx.employee.create({
        data: {
          employeeCode: "EMP00001",
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          joiningDate: new Date(),
          userId: user.id,
          companyId: company.id,
        },
      });

      return { company, user, employee };
    });

    const tokens = this.generateTokenPair(result.user);

    await prisma.user.update({
      where: { id: result.user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    const verificationToken = generateToken();
    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        resetToken: verificationToken,
        resetTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await emailService.sendWelcomeEmail({
      to: result.user.email,
      firstName: input.firstName,
      companyName: input.companyName,
      verificationToken,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        status: result.user.status,
        companyId: result.user.companyId,
        employeeId: result.employee.id,
      },
      ...tokens,
      companyId: result.company.id,
    };
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { employee: { select: { firstName: true } } },
    });

    if (!user) return;

    const resetToken = generateToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    await emailService.sendPasswordResetEmail({
      to: user.email,
      firstName: user.employee?.firstName || "User",
      resetToken,
    });
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: input.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_RESET_TOKEN);
    }

    const passwordHash = await this.hashPassword(input.password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        refreshToken: null,
      },
    });

    await emailService.sendPasswordChangedEmail({
      to: user.email,
    });
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const isValidPassword = await this.verifyPassword(
      input.currentPassword,
      user.passwordHash
    );
    if (!isValidPassword) {
      throw new BadRequestError("Current password is incorrect");
    }

    const passwordHash = await this.hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        refreshToken: null,
      },
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError(ERROR_MESSAGES.TOKEN_INVALID);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  async inviteEmployee(
    companyId: string,
    inviterId: string,
    input: InviteEmployeeInput
  ): Promise<{ userId: string; inviteToken: string }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError(ERROR_MESSAGES.USER_EXISTS);
    }

    const inviter = await prisma.user.findUnique({
      where: { id: inviterId },
      include: {
        company: { select: { name: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    const inviteToken = generateToken();
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        role: input.role,
        status: UserStatus.PENDING,
        companyId,
        inviteToken,
        inviteTokenExpiry,
      },
    });

    await emailService.sendInviteEmail({
      to: input.email,
      firstName: input.firstName as string,
      inviterName: inviter?.employee
        ? `${inviter.employee.firstName} ${inviter.employee.lastName}`
        : "Your team",
      companyName: inviter?.company?.name || "Your company",
      inviteToken,
      role: input.role as UserRole,
    });

    return { userId: user.id, inviteToken };
  }

  async acceptInvite(input: AcceptInviteInput): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await prisma.user.findFirst({
      where: {
        inviteToken: input.token,
        inviteTokenExpiry: { gt: new Date() },
        status: UserStatus.PENDING,
      },
    });

    if (!user) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_INVITE_TOKEN);
    }

    const passwordHash = await this.hashPassword(input.password);

    const lastEmployee = await prisma.employee.findFirst({
      where: { companyId: user.companyId! },
      orderBy: { employeeCode: "desc" },
    });
    const nextCode = lastEmployee
      ? `EMP${String(
          parseInt(lastEmployee.employeeCode.replace("EMP", "")) + 1
        ).padStart(5, "0")}`
      : "EMP00001";

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          inviteToken: null,
          inviteTokenExpiry: null,
        },
      });

      const employee = await tx.employee.create({
        data: {
          employeeCode: nextCode,
          firstName: "New",
          lastName: "Employee",
          email: user.email,
          joiningDate: new Date(),
          userId: user.id,
          companyId: user.companyId!,
        },
      });

      return { user: updatedUser, employee };
    });

    const tokens = this.generateTokenPair(result.user);

    await prisma.user.update({
      where: { id: result.user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        status: result.user.status,
        companyId: result.user.companyId,
        employeeId: result.employee.id,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");

    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, secret) as TokenPayload;
    } catch {
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError(ERROR_MESSAGES.ACCOUNT_INACTIVE);
    }

    const tokens = this.generateTokenPair(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async getProfile(
    userId: string
  ): Promise<AuthUser & { firstName?: string; lastName?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      companyId: user.companyId,
      employeeId: user.employee?.id || null,
      firstName: user.employee?.firstName,
      lastName: user.employee?.lastName,
    };
  }
}

export const authService = new AuthService();
