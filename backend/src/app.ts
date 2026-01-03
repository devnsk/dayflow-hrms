import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import routes from "./routes";
import { swaggerSpec } from "./swagger";
import { API_VERSION } from "./shared/constants";
import {
  notFoundHandler,
  errorHandler,
  defaultRateLimiter,
} from "./shared/middleware";
import { logger } from "./shared/utils/logger";

export function createApp(): Application {
  const app = express();

  // Trust proxy for accurate IP detection
  app.set("trust proxy", 1);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    })
  );

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request logging
  if (process.env.NODE_ENV !== "test") {
    app.use(
      morgan("combined", {
        stream: {
          write: (message: string) => {
            logger.info(message.trim());
          },
        },
      })
    );
  }

  // Rate limiting
  app.use(defaultRateLimiter);

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
    });
  });

  // API Documentation
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Dayflow HRMS API Documentation",
    })
  );

  // API docs JSON endpoint
  app.get("/api/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // API routes
  app.use(`/api/${API_VERSION.V1}`, routes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}
