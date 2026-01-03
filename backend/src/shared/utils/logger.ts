import { Request } from "express";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
  companyId?: string;
}

function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  if (["debug", "info", "warn", "error"].includes(level || "")) {
    return level as LogLevel;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const LOG_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  return LOG_PRIORITY[level] >= LOG_PRIORITY[currentLevel];
}

function formatLog(entry: LogEntry): string {
  const { timestamp, level, message, context, requestId, userId, companyId } =
    entry;

  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  const ids = [
    requestId && `reqId=${requestId}`,
    userId && `userId=${userId}`,
    companyId && `companyId=${companyId}`,
  ]
    .filter(Boolean)
    .join(" ");

  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  const idsStr = ids ? ` [${ids}]` : "";

  return `${prefix}${idsStr} ${message}${contextStr}`;
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  req?: Request
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    requestId: req?.headers["x-request-id"] as string | undefined,
    userId: (req as unknown as { user?: { id: string } })?.user?.id,
    companyId: (req as unknown as { companyId?: string })?.companyId,
  };
}

function output(level: LogLevel, entry: LogEntry): void {
  const formatted = formatLog(entry);

  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug(
    message: string,
    context?: Record<string, unknown>,
    req?: Request
  ): void {
    if (shouldLog("debug")) {
      output("debug", createEntry("debug", message, context, req));
    }
  },

  info(
    message: string,
    context?: Record<string, unknown>,
    req?: Request
  ): void {
    if (shouldLog("info")) {
      output("info", createEntry("info", message, context, req));
    }
  },

  warn(
    message: string,
    context?: Record<string, unknown>,
    req?: Request
  ): void {
    if (shouldLog("warn")) {
      output("warn", createEntry("warn", message, context, req));
    }
  },

  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>,
    req?: Request
  ): void {
    if (shouldLog("error")) {
      const errorContext =
        error instanceof Error
          ? {
              ...context,
              errorName: error.name,
              errorMessage: error.message,
              stack: error.stack,
            }
          : { ...context, error };

      output("error", createEntry("error", message, errorContext, req));
    }
  },

  request(req: Request, statusCode: number, duration: number): void {
    const message = `${req.method} ${req.originalUrl} ${statusCode} ${duration}ms`;
    const context = {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    };

    if (statusCode >= 500) {
      this.error(message, undefined, context, req);
    } else if (statusCode >= 400) {
      this.warn(message, context, req);
    } else {
      this.info(message, context, req);
    }
  },
};
