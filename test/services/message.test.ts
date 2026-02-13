import { vi, beforeEach, describe, it, expect } from "vitest";
import { prismaMock } from "../mocks/prisma";
import { mockMembers } from "@/lib/mock-members";
import { isQuietHours, validateSmsAllowed, sendGroupMessage, sendBlastMessage } from "@/services/message";
import { AppError } from "@/utils/errors";
import type { Message } from "@/generated/prisma/client";

// Test fixtures
const testMessage: Message = {
  id: 1,
  groupId: 5,
  senderId: 100001,
  subject: "Test Group Message",
  body: "This is a test message for the group.",
  sentAt: new Date("2024-01-15T10:00:00Z"),
  emailCount: 3,
  smsCount: 0,
  failedCount: 0,
  isBlast: false,
};

const testBlastMessage: Message = {
  id: 2,
  groupId: null,
  senderId: 100001,
  subject: "Test Blast Message",
  body: "This is a blast message to all members.",
  sentAt: new Date("2024-01-16T14:00:00Z"),
  emailCount: 389,
  smsCount: 0,
  failedCount: 0,
  isBlast: true,
};

// Mock modules
vi.mock("@/services/contact-group", () => ({
  getGroupRecipients: vi.fn(),
}));

vi.mock("@/services/email", () => ({
  sendGroupEmails: vi.fn(),
}));

vi.mock("@/lib/api/member-api", () => ({
  getMemberDetails: vi.fn(),
  getAllActiveMemberIds: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: {
    SMS_ENABLED: false,
    FROM_EMAIL: "no-reply@prfc.coop",
  },
}));

import { getGroupRecipients } from "@/services/contact-group";
import { sendGroupEmails } from "@/services/email";
import { getMemberDetails, getAllActiveMemberIds } from "@/lib/api/member-api";
import { env } from "@/env";

describe("isQuietHours", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("returns true during quiet hours (8 PM - 8 AM Pacific)", () => {
    // 9 PM Pacific = 5 AM UTC next day (during PST)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T05:00:00Z"));

    const result = isQuietHours();

    expect(result).toBe(true);
    vi.useRealTimers();
  });

  it("returns false during business hours (8 AM - 8 PM Pacific)", () => {
    // 10 AM Pacific = 6 PM UTC (during PST)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T18:00:00Z"));

    const result = isQuietHours();

    expect(result).toBe(false);
    vi.useRealTimers();
  });
});

describe("validateSmsAllowed", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("throws FORBIDDEN during quiet hours", () => {
    // 9 PM Pacific = 5 AM UTC next day (during PST)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T05:00:00Z"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (env as any).SMS_ENABLED = true;

    expect(() => validateSmsAllowed()).toThrow(AppError);
    expect(() => validateSmsAllowed()).toThrow("SMS messages cannot be sent during quiet hours");

    try {
      validateSmsAllowed();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("FORBIDDEN");
      expect((error as AppError).context).toEqual({ reason: "QUIET_HOURS" });
    }

    vi.useRealTimers();
  });

  it("throws FORBIDDEN when SMS_ENABLED=false", () => {
    // 10 AM Pacific = 6 PM UTC (during PST)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T18:00:00Z"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (env as any).SMS_ENABLED = false;

    expect(() => validateSmsAllowed()).toThrow(AppError);
    expect(() => validateSmsAllowed()).toThrow("SMS functionality is currently disabled");

    try {
      validateSmsAllowed();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("FORBIDDEN");
      expect((error as AppError).context).toEqual({ reason: "SMS_DISABLED" });
    }

    vi.useRealTimers();
  });
});

describe("sendGroupMessage", () => {
  const testRecipients = [mockMembers[1], mockMembers[2], mockMembers[3]];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (env as any).SMS_ENABLED = false;
  });

  it("creates Message record with correct data", async () => {
    const input = {
      groupId: 5,
      subject: "Test Subject",
      body: "Test Body",
      sendEmail: true,
      sendSms: false,
    };

    vi.mocked(getGroupRecipients).mockResolvedValue([100002, 100003, 100004]);
    vi.mocked(getMemberDetails).mockResolvedValue(testRecipients);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 3, failed: 0, suppressed: 0 });

    const createdMessage = {
      ...testMessage,
      id: 1,
      groupId: 5,
      senderId: 100001,
      subject: "Test Subject",
      body: "Test Body",
      emailCount: 3,
      smsCount: 0,
      failedCount: 0,
      isBlast: false,
    };

    prismaMock.$transaction.mockImplementation(async (callback) => {
      return callback({
        message: {
          create: vi.fn().mockResolvedValue(createdMessage),
        },
        messageRecipient: {
          createMany: vi.fn().mockResolvedValue({ count: 3 }),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    prismaMock.messageRecipient.updateMany.mockResolvedValue({ count: 3 });
    prismaMock.message.update.mockResolvedValue(createdMessage);

    const result = await sendGroupMessage(input, 100001);

    expect(result.messageId).toBe(1);
  });

  it("creates MessageRecipient records for email recipients", async () => {
    const input = {
      groupId: 5,
      subject: "Test Subject",
      body: "Test Body",
      sendEmail: true,
      sendSms: false,
    };

    vi.mocked(getGroupRecipients).mockResolvedValue([100002, 100003, 100004]);
    vi.mocked(getMemberDetails).mockResolvedValue(testRecipients);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 3, failed: 0, suppressed: 0 });

    let capturedRecipients: Array<{ messageId: number; memberId: number; channel: string; status: string }> = [];

    prismaMock.$transaction.mockImplementation(async (callback) => {
      return callback({
        message: {
          create: vi.fn().mockResolvedValue({ ...testMessage, id: 1 }),
        },
        messageRecipient: {
          createMany: vi.fn().mockImplementation((args) => {
            capturedRecipients = args.data;
            return { count: 3 };
          }),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    prismaMock.messageRecipient.updateMany.mockResolvedValue({ count: 3 });
    prismaMock.message.update.mockResolvedValue(testMessage);

    await sendGroupMessage(input, 100001);

    expect(capturedRecipients).toEqual([
      {
        messageId: 1,
        memberId: 100002,
        channel: "email",
        status: "pending",
      },
      {
        messageId: 1,
        memberId: 100003,
        channel: "email",
        status: "pending",
      },
      {
        messageId: 1,
        memberId: 100004,
        channel: "email",
        status: "pending",
      },
    ]);
  });

  it("respects sendEmail flag", async () => {
    const input = {
      groupId: 5,
      subject: "Test Subject",
      body: "Test Body",
      sendEmail: false,
      sendSms: false,
    };

    await expect(sendGroupMessage(input, 100001)).rejects.toThrow(
      "At least one delivery method (email or SMS) must be selected",
    );
  });

  it("throws when no recipients found", async () => {
    const input = {
      groupId: 5,
      subject: "Test Subject",
      body: "Test Body",
      sendEmail: true,
      sendSms: false,
    };

    vi.mocked(getGroupRecipients).mockResolvedValue([]);

    await expect(sendGroupMessage(input, 100001)).rejects.toThrow("No recipients found for selected delivery methods");
  });

  it("updates failedCount when emails fail", async () => {
    const input = {
      groupId: 5,
      subject: "Test Subject",
      body: "Test Body",
      sendEmail: true,
      sendSms: false,
    };

    vi.mocked(getGroupRecipients).mockResolvedValue([100002, 100003, 100004]);
    vi.mocked(getMemberDetails).mockResolvedValue(testRecipients);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 1, failed: 2, suppressed: 0 });

    prismaMock.$transaction.mockImplementation(async (callback) => {
      return callback({
        message: {
          create: vi.fn().mockResolvedValue({ ...testMessage, id: 1 }),
        },
        messageRecipient: {
          createMany: vi.fn().mockResolvedValue({ count: 3 }),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    prismaMock.messageRecipient.updateMany.mockResolvedValue({ count: 2 });
    prismaMock.message.update.mockResolvedValue({ ...testMessage, failedCount: 2 });

    const result = await sendGroupMessage(input, 100001);

    expect(prismaMock.message.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { failedCount: 2 },
    });

    expect(result.failedCount).toBe(2);
    expect(result.emailCount).toBe(1);
  });
});

describe("sendBlastMessage", () => {
  const allMemberIds = mockMembers.map((m) => m.ownerid);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (env as any).SMS_ENABLED = false;
  });

  it("sets isBlast=true and groupId=null", async () => {
    const input = {
      subject: "Blast Message",
      body: "This is a blast message",
      sendEmail: true,
      sendSms: false,
      confirmationText: "SEND TO ALL" as const,
    };

    vi.mocked(getAllActiveMemberIds).mockResolvedValue(allMemberIds);
    vi.mocked(getMemberDetails).mockResolvedValue([...mockMembers]);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 389, failed: 0, suppressed: 0 });

    const createdMessage = { ...testBlastMessage, id: 2 };

    prismaMock.$transaction.mockImplementation(async (callback) => {
      return callback({
        message: {
          create: vi.fn().mockResolvedValue(createdMessage),
        },
        messageRecipient: {
          createMany: vi.fn().mockResolvedValue({ count: 389 }),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    prismaMock.messageRecipient.updateMany.mockResolvedValue({ count: 389 });
    prismaMock.message.update.mockResolvedValue(testBlastMessage);

    const result = await sendBlastMessage(input, 100001);

    expect(result.messageId).toBe(2);
  });

  it("sends to all active members", async () => {
    const input = {
      subject: "Blast Message",
      body: "This is a blast message",
      sendEmail: true,
      sendSms: false,
      confirmationText: "SEND TO ALL" as const,
    };

    vi.mocked(getAllActiveMemberIds).mockResolvedValue(allMemberIds);
    vi.mocked(getMemberDetails).mockResolvedValue([...mockMembers]);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 389, failed: 0, suppressed: 0 });

    prismaMock.$transaction.mockImplementation(async (callback) => {
      return callback({
        message: {
          create: vi.fn().mockResolvedValue({ ...testBlastMessage, id: 2 }),
        },
        messageRecipient: {
          createMany: vi.fn().mockResolvedValue({ count: 389 }),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    prismaMock.messageRecipient.updateMany.mockResolvedValue({ count: 389 });
    prismaMock.message.update.mockResolvedValue(testBlastMessage);

    await sendBlastMessage(input, 100001);

    expect(getAllActiveMemberIds).toHaveBeenCalled();
    expect(getMemberDetails).toHaveBeenCalledWith(allMemberIds);
  });

  it("updates failedCount when emails fail", async () => {
    const input = {
      subject: "Blast Message",
      body: "This is a blast message",
      sendEmail: true,
      sendSms: false,
      confirmationText: "SEND TO ALL" as const,
    };

    vi.mocked(getAllActiveMemberIds).mockResolvedValue(allMemberIds);
    vi.mocked(getMemberDetails).mockResolvedValue([...mockMembers]);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 350, failed: 39, suppressed: 0 });

    prismaMock.$transaction.mockImplementation(async (callback) => {
      return callback({
        message: {
          create: vi.fn().mockResolvedValue({ ...testBlastMessage, id: 2 }),
        },
        messageRecipient: {
          createMany: vi.fn().mockResolvedValue({ count: 389 }),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    prismaMock.messageRecipient.updateMany.mockResolvedValue({ count: 39 });
    prismaMock.message.update.mockResolvedValue({ ...testBlastMessage, failedCount: 39 });

    const result = await sendBlastMessage(input, 100001);

    expect(prismaMock.message.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { failedCount: 39 },
    });

    expect(result.failedCount).toBe(39);
    expect(result.emailCount).toBe(350);
  });
});
