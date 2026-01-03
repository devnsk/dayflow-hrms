import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, TokenPayload } from "../types";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { ERROR_MESSAGES } from "../constants";
import { prisma } from "../../prisma/client";
import { UserRole, UserStatus } from "@prisma/client";

function extractToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

function verifyToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.verify(token, secret) as TokenPayload;
}

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const payload = verifyToken(token);

    if (payload.type !== "access") {
      throw new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        companyId: true,
        emailVerified: true,
        employee: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedError(ERROR_MESSAGES.ACCOUNT_INACTIVE);
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedError(ERROR_MESSAGES.ACCOUNT_SUSPENDED);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      companyId: user.companyId,
      employeeId: user.employee?.id || null,
    };

    req.companyId = user.companyId || undefined;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError(ERROR_MESSAGES.TOKEN_EXPIRED));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError(ERROR_MESSAGES.TOKEN_INVALID));
    } else {
      next(error);
    }
  }
}

export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    const payload = verifyToken(token);

    if (payload.type !== "access") {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        companyId: true,
        employee: {
          select: { id: true },
        },
      },
    });

    if (user && user.status === UserStatus.ACTIVE) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        companyId: user.companyId,
        employeeId: user.employee?.id || null,
      };
      req.companyId = user.companyId || undefined;
    }

    next();
  } catch {
    next();
  }
}

export async function requireEmailVerified(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    return next(new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED));
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    return next(new ForbiddenError(ERROR_MESSAGES.EMAIL_NOT_VERIFIED));
  }

  next();
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(ERROR_MESSAGES.FORBIDDEN));
    }

    next();
  };
}

export const requireSuperAdmin = requireRoles(UserRole.SUPER_ADMIN);

export const requireCompanyAdmin = requireRoles(
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN
);

export const requireManager = requireRoles(
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
  UserRole.MANAGER
);

export function requireSameCompany(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED));
  }

  if (req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  const requestedCompanyId = req.params.companyId || req.body.companyId;

  if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
    return next(new ForbiddenError(ERROR_MESSAGES.FORBIDDEN));
  }

  next();
}

export async function requireSelfOrManager(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    return next(new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED));
  }

  if (
    ([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN] as UserRole[]).includes(
      req.user.role
    )
  ) {
    return next();
  }

  const targetEmployeeId = req.params.employeeId;

  if (targetEmployeeId === req.user.employeeId) {
    return next();
  }

  if (req.user.employeeId) {
    const targetEmployee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: { managerId: true },
    });

    if (targetEmployee?.managerId === req.user.employeeId) {
      return next();
    }
  }

  return next(new ForbiddenError(ERROR_MESSAGES.FORBIDDEN));
}
