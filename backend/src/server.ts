import "dotenv/config";
import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./prisma/client";
import { logger } from "./shared/utils/logger";

const PORT = parseInt(process.env.PORT || "4000", 10);
const HOST = process.env.HOST || "0.0.0.0";

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();

    const app = createApp();

    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Dayflow HRMS API Server started`, {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV || "development",
        apiDocs: `http://localhost:${PORT}/api/docs`,
      });

      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🔷 DAYFLOW HRMS API                                      ║
║                                                            ║
║   Server:     http://localhost:${PORT}                        ║
║   API Docs:   http://localhost:${PORT}/api/docs               ║
║   Health:     http://localhost:${PORT}/health                 ║
║                                                            ║
║   Environment: ${(process.env.NODE_ENV || "development").padEnd(40)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info("HTTP server closed");

        await disconnectDatabase();
        logger.info("Database connection closed");

        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Forced shutdown due to timeout");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", error);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", { promise, reason });
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

bootstrap();
