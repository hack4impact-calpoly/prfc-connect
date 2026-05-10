import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { faker } from "@faker-js/faker";
import { parseArgs } from "node:util";
import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function encrypt(plaintext: string): string {
  const key = process.env.FIELD_ENCRYPTION_KEY;
  if (!key) throw new Error("FIELD_ENCRYPTION_KEY is required for seeding");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString("base64url");
}

function createAdapter() {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }
  const url = new URL(process.env.DATABASE_URL);
  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    connectionLimit: 1,
  });
}

const adapter = createAdapter();
const prisma = new PrismaClient({ adapter });

const { values } = parseArgs({
  options: {
    count: { type: "string", short: "c", default: "100" },
    reset: { type: "boolean", short: "r", default: true },
    seed: { type: "string", short: "s", default: "42" },
  } as const,
});

type ReferralInput = Prisma.ReferralCreateManyInput;

const EMAIL_PROVIDERS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "hotmail.com"];

function genReferral(): ReferralInput {
  const mFirst = faker.person.firstName();
  const mLast = faker.person.lastName();
  const pFirst = faker.person.firstName();
  const pLast = faker.person.lastName();

  return {
    memberName: encrypt(`${mFirst} ${mLast}`),
    memberEmail: encrypt(
      faker.internet.email({
        firstName: mFirst,
        lastName: mLast,
        provider: faker.helpers.arrayElement(EMAIL_PROVIDERS),
      }),
    ),
    prospectName: encrypt(`${pFirst} ${pLast}`),
    prospectEmail: encrypt(faker.internet.email({ firstName: pFirst, lastName: pLast })),
    referralCode: faker.string.alphanumeric({ length: 8, casing: "upper", exclude: ["O", "0", "I", "L", "1"] }),
    redeemed: faker.datatype.boolean({ probability: 0.25 }),
    createdAt: faker.date.between({ from: "2025-01-01", to: "2025-12-01" }),
  };
}

function assertSafeToSeed() {
  if (process.env.NODE_ENV === "production") {
    console.error("Cannot seed production database");
    process.exit(1);
  }

  if (process.env.ALLOW_REMOTE_SEED === "true") return;

  const dbUrl = process.env.DATABASE_URL ?? "";
  if (/prod|production|live/i.test(dbUrl)) {
    console.error("DATABASE_URL appears to reference production");
    process.exit(1);
  }
}

async function main() {
  const count = parseInt(values.count, 10);
  const fakerSeed = parseInt(values.seed, 10);

  if (Number.isNaN(count) || count < 1) {
    console.error("--count must be a positive integer");
    process.exit(1);
  }
  if (Number.isNaN(fakerSeed)) {
    console.error("--seed must be an integer");
    process.exit(1);
  }

  assertSafeToSeed();

  console.log(`Seeding ${count} referrals (seed: ${fakerSeed})`);

  faker.seed(fakerSeed);
  faker.setDefaultRefDate("2025-12-01T00:00:00.000Z");

  const BATCH = 1000;
  const batches: ReferralInput[][] = [];
  for (let i = 0; i < count; i += BATCH) {
    const size = Math.min(BATCH, count - i);
    batches.push(Array.from({ length: size }, genReferral));
  }

  await prisma.$transaction(
    async (tx) => {
      if (values.reset) {
        await tx.referral.deleteMany();
        await tx.$executeRaw`ALTER TABLE referral AUTO_INCREMENT = 1`;
        console.log("Cleared existing data");
      }

      let created = 0;
      for (const batch of batches) {
        const result = await tx.referral.createMany({ data: batch });
        created += result.count;
      }

      const redeemed = await tx.referral.count({ where: { redeemed: true } });
      console.log(`Created ${created} referrals (${redeemed} redeemed)`);
    },
    { timeout: 30000 },
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
