import * as grpc from "@grpc/grpc-js";
import { GrpcUserService } from "./user-service.grpc";
import { getLogger } from "../utils/logger";

const logger = getLogger();

class GrpcServer {
  private server: grpc.Server;
  private userService: GrpcUserService;
  private port: string;

  constructor() {
    this.server = new grpc.Server({
      // Security and performance options
      "grpc.keepalive_time_ms": 30000,
      "grpc.keepalive_timeout_ms": 5000,
      "grpc.keepalive_permit_without_calls": 1,
      "grpc.http2.max_pings_without_data": 0,
      "grpc.http2.min_time_between_pings_ms": 10000,
      "grpc.http2.min_ping_interval_without_data_ms": 300000,
      "grpc.max_connection_idle_ms": 300000,
      "grpc.max_connection_age_ms": 600000,
      "grpc.max_connection_age_grace_ms": 30000,
      // Message size limits
      "grpc.max_send_message_length": 4 * 1024 * 1024, // 4MB
      "grpc.max_receive_message_length": 4 * 1024 * 1024, // 4MB
    });

    this.userService = new GrpcUserService();
    this.port = process.env.GRPC_PORT || "50051";
  }

  private setupServices() {
    // Add the UserService to the server using proto-loader
    this.server.addService(
      GrpcUserService.getProtoService().service,
      this.userService.getServiceDefinition()
    );
  }

  async start() {
    try {
      // Setup services
      this.setupServices();

      // Start the server
      this.server.bindAsync(
        `0.0.0.0:${this.port}`,
        grpc.ServerCredentials.createInsecure(),
        (error: any, port: any) => {
          if (error) {
            logger.error("❌ Failed to bind gRPC server:", error);
            process.exit(1);
          }

          logger.info(`🚀 Secure gRPC Server running on port ${port}`);
          logger.info(`🔐 Security: API Key Authentication`);
          logger.info(`📡 Available services:`);
          logger.info(`   - UserService.GetUser`);
          logger.info(`   - UserService.GetUserByEmail`);
          logger.info(`   - UserService.GetUserTopic`);
          logger.info(`   - UserService.CheckAvailabilities [SECURED]`);
          logger.info(
            `   - UserService.UpdateAvailabilitiesToUnavailable [SECURED]`
          );
          logger.info(`   - UserService.HealthCheck`);
          logger.info(
            `\n🔑 API Keys configured: ${
              process.env.USER_SERVICE_API_KEY ? "Yes" : "Using defaults"
            }`
          );

          this.server.start();
        }
      );

      // Handle graceful shutdown
      process.on("SIGINT", () => {
        logger.info("\n🛑 Received SIGINT, shutting down gracefully...");
        this.shutdown();
      });

      process.on("SIGTERM", () => {
        logger.info("\n🛑 Received SIGTERM, shutting down gracefully...");
        this.shutdown();
      });
    } catch (error: any) {
      logger.error("❌ Failed to start gRPC server:", error);
      process.exit(1);
    }
  }

  private shutdown() {
    this.server.tryShutdown((error: any) => {
      if (error) {
        logger.error("❌ Error during shutdown:", error);
        process.exit(1);
      }

      logger.info("✅ gRPC server shut down successfully");
    });
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new GrpcServer();
  server.start().catch((error) => {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  });
}

export default GrpcServer;
