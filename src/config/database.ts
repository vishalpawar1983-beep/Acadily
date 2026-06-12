import dns from "dns";
import mongoose from "mongoose";
import { config } from "./index.js";
import { logger } from "../shared/infrastructure/logger/PinoLogger.js";
import { dbConnectionsGauge } from "../shared/infrastructure/metrics/MetricsService.js";

function configureDnsServers() {
  const hasLocalDnsProxy =
    dns.getServers().length === 1 && dns.getServers()[0] === "127.0.0.1";
  const fallbackDns = ["8.8.8.8", "1.1.1.1"];
  const explicitServers = config.DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (explicitServers?.length) {
    dns.setServers(explicitServers);
    logger.info(
      { dnsServers: dns.getServers() },
      "Using explicit DNS servers for MongoDB resolution",
    );
  } else if (hasLocalDnsProxy) {
    dns.setServers(fallbackDns);
    logger.warn(
      { dnsServers: dns.getServers() },
      "Local DNS resolver at 127.0.0.1 is being bypassed for MongoDB DNS resolution",
    );
  }
}

export async function connectDatabase(): Promise<void> {
  configureDnsServers();

  try {
    const conn = await mongoose.connect(config.MONGO_URI);
    logger.info(
      { host: conn.connection.host, name: conn.connection.name },
      "MongoDB connected",
    );
  } catch (error) {
    logger.fatal({ err: error }, "MongoDB connection failed");
    throw error;
  }

  dbConnectionsGauge.set({ state: "connected" }, 1);

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
    dbConnectionsGauge.set({ state: "connected" }, 0);
    dbConnectionsGauge.set({ state: "disconnected" }, 1);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
    dbConnectionsGauge.set({ state: "connected" }, 0);
    dbConnectionsGauge.set({ state: "disconnected" }, 1);
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
    dbConnectionsGauge.set({ state: "connected" }, 1);
    dbConnectionsGauge.set({ state: "disconnected" }, 0);
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected gracefully");
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
