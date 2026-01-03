import { Response } from "express";
import { ApiResponse, PaginationMeta, ValidationError } from "../types";
import { HTTP_STATUS } from "../constants";

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK,
  meta?: PaginationMeta
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(
  res: Response,
  data?: T,
  message: string = "Created successfully"
): Response {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
}

export function sendNoContent(res: Response): Response {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: ValidationError[]
): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
    errors,
  };
  return res.status(statusCode).json(response);
}

export function sendBadRequest(
  res: Response,
  message: string = "Bad request",
  errors?: ValidationError[]
): Response {
  return sendError(res, message, HTTP_STATUS.BAD_REQUEST, errors);
}

export function sendUnauthorized(
  res: Response,
  message: string = "Unauthorized"
): Response {
  return sendError(res, message, HTTP_STATUS.UNAUTHORIZED);
}

export function sendForbidden(
  res: Response,
  message: string = "Forbidden"
): Response {
  return sendError(res, message, HTTP_STATUS.FORBIDDEN);
}

export function sendNotFound(
  res: Response,
  message: string = "Resource not found"
): Response {
  return sendError(res, message, HTTP_STATUS.NOT_FOUND);
}

export function sendConflict(
  res: Response,
  message: string = "Resource already exists"
): Response {
  return sendError(res, message, HTTP_STATUS.CONFLICT);
}

export function sendValidationError(
  res: Response,
  errors: ValidationError[],
  message: string = "Validation error"
): Response {
  return sendError(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
}

export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): Response {
  const meta = createPaginationMeta(total, page, limit);
  return sendSuccess(res, data, message, HTTP_STATUS.OK, meta);
}
