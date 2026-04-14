import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";
import { env } from "@/env";

function createAdapter() {
  // TiDB serverless uses HTTPS, avoiding connection pool exhaustion in Vercel
  if (process.env.VERCEL) {
    return new PrismaTiDBCloud({ url: env.DATABASE_URL });
  }

  // Local/CI uses TCP connection to Docker MySQL
  const url = new URL(env.DATABASE_URL);
  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    connectionLimit: 5,
    keepAliveDelay: 30000,
    socketTimeout: 60000,
    timezone: "Z",
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createAdapter(),
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
