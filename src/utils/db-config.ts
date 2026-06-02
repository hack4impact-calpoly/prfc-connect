export type DbPoolConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  idleTimeout: number;
  socketTimeout: number;
  timezone: string;
  ssl?: { rejectUnauthorized: boolean };
};

export function buildDbPoolConfig(databaseUrl: string): DbPoolConfig {
  const url = new URL(databaseUrl);
  const config: DbPoolConfig = {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 3,
    idleTimeout: 5,
    socketTimeout: 60000,
    timezone: "Z",
  };

  if (url.searchParams.get("ssl") === "true") {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}
