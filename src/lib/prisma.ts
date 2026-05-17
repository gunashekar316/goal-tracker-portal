import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Set up WebSocket for Neon
neonConfig.webSocketConstructor = ws;

const prismaClientSingleton = () => {
  const connectionString = `${process.env.DATABASE_URL}`;
  const adapter = new PrismaNeon({ connectionString });
  
  return new PrismaClient({
    adapter,
    errorFormat: "pretty",
    log: ["query", "error", "warn"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}