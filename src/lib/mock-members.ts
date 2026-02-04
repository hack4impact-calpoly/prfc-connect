import { faker } from "@faker-js/faker";

export interface MockMember {
  ownerid: number;
  ownername: string;
  owneremail: string;
  ownerphone: string;
  owneraltphone?: string;
}

const SEED = 12345;
const START_ID = 100001;
const MEMBER_COUNT = 389;
const EMAIL_PROVIDERS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "hotmail.com"];

faker.seed(SEED);
faker.setDefaultRefDate("2025-12-01T00:00:00.000Z");

function generateMember(ownerid: number): MockMember {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const fullName = `${firstName} ${lastName}`;

  const email = faker.internet.email({
    firstName,
    lastName,
    provider: faker.helpers.arrayElement(EMAIL_PROVIDERS),
  });

  const phone = faker.helpers.fromRegExp("805-[2-9][0-9]{2}-[0-9]{4}");

  const altPhone = faker.helpers.maybe(() => faker.helpers.fromRegExp("805-[2-9][0-9]{2}-[0-9]{4}"), {
    probability: 0.25,
  });

  return {
    ownerid,
    ownername: fullName,
    owneremail: email,
    ownerphone: phone,
    owneraltphone: altPhone,
  };
}

export const mockMembers: readonly MockMember[] = Array.from({ length: MEMBER_COUNT }, (_, i) =>
  generateMember(START_ID + i),
);

export const mockAdminIds = [100001, 100002] as const;

export const mockAdmin1 = mockMembers[0];

export const mockAdmin2 = mockMembers[1];

export function findMemberById(ownerid: number): MockMember | undefined {
  return mockMembers.find((m) => m.ownerid === ownerid);
}

export function isMockAdmin(ownerid: number): boolean {
  return mockAdminIds.includes(ownerid as (typeof mockAdminIds)[number]);
}
