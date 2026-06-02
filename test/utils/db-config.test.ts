import { buildDbPoolConfig } from "@/utils/db-config";

describe("buildDbPoolConfig", () => {
  it("parses host, port, user, password, and database from a basic url", () => {
    const config = buildDbPoolConfig("mysql://app:secret@db.example.com:3306/coop");
    expect(config.host).toBe("db.example.com");
    expect(config.port).toBe(3306);
    expect(config.user).toBe("app");
    expect(config.password).toBe("secret");
    expect(config.database).toBe("coop");
  });

  it("decodes percent-encoded credentials", () => {
    const config = buildDbPoolConfig("mysql://co%40op:p%40ss%2Fw0%3Ard%231@host/db");
    expect(config.user).toBe("co@op");
    expect(config.password).toBe("p@ss/w0:rd#1");
  });

  it("defaults the port to 3306 when the url omits it", () => {
    expect(buildDbPoolConfig("mysql://u:p@host/db").port).toBe(3306);
  });

  it("uses a small pool and the UTC timezone", () => {
    const config = buildDbPoolConfig("mysql://u:p@host/db");
    expect(config.connectionLimit).toBe(3);
    expect(config.idleTimeout).toBe(5);
    expect(config.timezone).toBe("Z");
  });

  it("enables encrypted TLS without certificate verification when ?ssl=true", () => {
    expect(buildDbPoolConfig("mysql://u:p@host/db?ssl=true").ssl).toEqual({ rejectUnauthorized: false });
  });

  it("leaves ssl unset when absent or not true", () => {
    expect(buildDbPoolConfig("mysql://u:p@host/db").ssl).toBeUndefined();
    expect(buildDbPoolConfig("mysql://u:p@host/db?ssl=false").ssl).toBeUndefined();
  });
});
