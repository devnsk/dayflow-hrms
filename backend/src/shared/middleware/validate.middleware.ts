import { Request, Response, NextFunction } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { HTTP_STATUS, ERROR_MESSAGES } from "../constants";
import { ApiResponse, ValidationError } from "../types";

type ValidationSource = "body" | "query" | "params";

interface ValidationConfig {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function formatZodErrors(
  error: ZodError,
  source: ValidationSource
): ValidationError[] {
  return error.errors.map((err) => ({
    field: `${source}.${err.path.join(".")}`,
    message: err.message,
  }));
}

export function validate(config: ValidationConfig) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const errors: ValidationError[] = [];

    try {
      if (config.body) {
        try {
          req.body = await config.body.parseAsync(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, "body"));
          }
        }
      }

      if (config.query) {
        try {
          req.query = await config.query.parseAsync(req.query);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, "query"));
          }
        }
      }

      if (config.params) {
        try {
          req.params = await config.params.parseAsync(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, "params"));
          }
        }
      }

      if (errors.length > 0) {
        const response: ApiResponse = {
          success: false,
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          errors,
        };
        res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateBody(schema: ZodTypeAny) {
  return validate({ body: schema });
}

export function validateQuery(schema: ZodTypeAny) {
  return validate({ query: schema });
}

export function validateParams(schema: ZodTypeAny) {
  return validate({ params: schema });
}
