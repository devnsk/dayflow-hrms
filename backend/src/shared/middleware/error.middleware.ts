import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  AppError,
  ValidationError as AppValidationError,
} from "../utils/errors";
import { logger } from "../utils/logger";
import { HTTP_STATUS, ERROR_MESSAGES } from "../constants";
import { ApiResponse, ValidationError } from "../types";

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND
  );
  next(error);
}

function formatZodErrors(error: ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(
    "Error caught by global handler",
    error,
    {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      query: req.query,
    },
    req
  );

  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message: string = ERROR_MESSAGES.INTERNAL_ERROR;
  let errors: ValidationError[] | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;

    if (error instanceof AppValidationError) {
      errors = error.errors;
    }
  } else if (error instanceof ZodError) {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = ERROR_MESSAGES.VALIDATION_ERROR;
    errors = formatZodErrors(error);
  } else if (error.name === "PrismaClientKnownRequestError") {
    const prismaError = error as unknown as {
      code: string;
      meta?: { target?: string[] };
    };

    switch (prismaError.code) {
      case "P2002":
        statusCode = HTTP_STATUS.CONFLICT;
        const field = prismaError.meta?.target?.[0] || "field";
        message = `A record with this ${field} already exists`;
        break;
      case "P2025":
        statusCode = HTTP_STATUS.NOT_FOUND;
        message = ERROR_MESSAGES.RESOURCE_NOT_FOUND;
        break;
      default:
        message = "Database error occurred";
    }
  } else if (error.name === "PrismaClientValidationError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Invalid data provided";
  }

  if (
    process.env.NODE_ENV === "production" &&
    statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR
  ) {
    message = ERROR_MESSAGES.INTERNAL_ERROR;
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    errors,
  };

  res.status(statusCode).json(response);
}

export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
