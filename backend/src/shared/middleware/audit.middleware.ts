import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { prisma } from "../../prisma/client";
import { AuditAction } from "@prisma/client";
import { logger } from "../utils/logger";

interface AuditData {
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

export async function createAuditLog(
  req: AuthRequest,
  data: AuditData
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: (data.oldValues as object) || undefined,
        newValues: (data.newValues as object) || undefined,
        userId: req.user?.id,
        companyId: req.user?.companyId,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });
  } catch (error) {
    logger.error("Failed to create audit log", error);
  }
}

export function audit(
  action: AuditAction,
  entityType: string,
  getEntityId: (req: AuthRequest) => string
) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const originalSend = res.send;

    res.send = function (body: unknown) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = getEntityId(req);

        createAuditLog(req, {
          action,
          entityType,
          entityId,
          newValues: req.body,
        }).catch((error) => {
          logger.error("Audit log creation failed", error);
        });
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

export const auditAction = {
  async create(
    req: AuthRequest,
    entityType: string,
    entityId: string,
    newValues?: Record<string, unknown>
  ): Promise<void> {
    await createAuditLog(req, {
      action: AuditAction.CREATE,
      entityType,
      entityId,
      newValues,
    });
  },

  async update(
    req: AuthRequest,
    entityType: string,
    entityId: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
  ): Promise<void> {
    await createAuditLog(req, {
      action: AuditAction.UPDATE,
      entityType,
      entityId,
      oldValues,
      newValues,
    });
  },

  async delete(
    req: AuthRequest,
    entityType: string,
    entityId: string,
    oldValues?: Record<string, unknown>
  ): Promise<void> {
    await createAuditLog(req, {
      action: AuditAction.DELETE,
      entityType,
      entityId,
      oldValues,
    });
  },

  async login(req: AuthRequest, userId: string): Promise<void> {
    await createAuditLog(req, {
      action: AuditAction.LOGIN,
      entityType: "users",
      entityId: userId,
    });
  },

  async logout(req: AuthRequest, userId: string): Promise<void> {
    await createAuditLog(req, {
      action: AuditAction.LOGOUT,
      entityType: "users",
      entityId: userId,
    });
  },

  async approve(
    req: AuthRequest,
    entityType: string,
    entityId: string,
    newValues?: Record<string, unknown>
  ): Promise<void> {
    await createAuditLog(req, {
      action: AuditAction.APPROVE,
      entityType,
      entityId,
      newValues,
    });
  },

  async reject(
    req: AuthRequest,
    entityType: string,
    entityId: string,
    newValues?: Record<string, unknown>
  ): Promise<void> {
    await createAuditLog(req, {
      action: AuditAction.REJECT,
      entityType,
      entityId,
      newValues,
    });
  },

  async export(
    req: AuthRequest,
    entityType: string,
    filters?: Record<string, unknown>
  ): Promise<void> {
    await createAuditLog(req, {
      action: AuditAction.EXPORT,
      entityType,
      entityId: "export",
      newValues: filters,
    });
  },
};
