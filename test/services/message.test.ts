import { vi } from "vitest";
import { mockPrisma, mockInteractiveTransaction } from "../mocks/prisma";
import { mockMembers } from "@/lib/mock-members";
import { isQuietHours, validateSmsAllowed, sendGroupMessage, sendBlastMessage } from "@/services/message";
import { AppError } from "@/utils/errors";
import type { Message } from "@/generated/prisma/client";

// Test fixtures
const testMessage: Message = {
  id: 1,
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
  senderId: 100001,
  subject: "Test Blast Message",
  body: "This is a blast message to all members.",
  sentAt: new Date("2024-01-16T14:00:00Z"),
  emailCount: 389,
  smsCount: 0,
  failedCount: 0,
  isBlast: true,
};

const mockEnv = vi.hoisted(() => ({
  EMAIL_ENABLED: false as boolean,
  SMS_ENABLED: false as boolean,
  FROM_EMAIL: "no-reply@prfc.coop",
}));

// Mock modules
vi.mock("@/services/contact-group", () => ({
  getGroupRecipients: vi.fn(),
}));

vi.mock("@/services/email", () => ({
  sendGroupEmails: vi.fn(),
  validateEmailAllowed: vi.fn(() => {
    if (!mockEnv.EMAIL_ENABLED) {
      throw new AppError("FORBIDDEN", "Email functionality is currently disabled", { reason: "EMAIL_DISABLED" });
    }
  }),
}));

vi.mock("@/lib/api/member-api", () => ({
  getMemberDetails: vi.fn(),
  getAllActiveMemberIds: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: mockEnv,
}));

import { getGroupRecipients } from "@/services/contact-group";
import { sendGroupEmails } from "@/services/email";
import { getMemberDetails, getAllActiveMemberIds } from "@/lib/api/member-api";

describe("isQuietHours", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true during quiet hours (9 PM Pacific)", () => {
    // 9 PM Pacific = 5 AM UTC next day (during PST)
    vi.setSystemTime(new Date("2024-01-15T05:00:00Z"));
    expect(isQuietHours()).toBe(true);
  });

  it("returns false during business hours (10 AM Pacific)", () => {
    // 10 AM Pacific = 6 PM UTC (during PST)
    vi.setSystemTime(new Date("2024-01-15T18:00:00Z"));
    expect(isQuietHours()).toBe(false);
  });

  it("returns false at exactly 8:00 AM Pacific (first non-quiet hour)", () => {
    // 8 AM Pacific = 4 PM UTC (during PST, UTC-8)
    vi.setSystemTime(new Date("2024-01-15T16:00:00Z"));
    expect(isQuietHours()).toBe(false);
  });

  it("returns true at 7:59 AM Pacific (last quiet hour)", () => {
    // 7:59 AM Pacific = 3:59 PM UTC (during PST)
    vi.setSystemTime(new Date("2024-01-15T15:59:00Z"));
    expect(isQuietHours()).toBe(true);
  });

  it("returns true at exactly 8:00 PM Pacific (first quiet hour)", () => {
    // 8 PM Pacific = 4 AM UTC next day (during PST)
    vi.setSystemTime(new Date("2024-01-16T04:00:00Z"));
    expect(isQuietHours()).toBe(true);
  });

  it("returns false at 7:59 PM Pacific (last non-quiet hour)", () => {
    // 7:59 PM Pacific = 3:59 AM UTC next day (during PST)
    vi.setSystemTime(new Date("2024-01-16T03:59:00Z"));
    expect(isQuietHours()).toBe(false);
  });
});

describe("validateSmsAllowed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws FORBIDDEN during quiet hours", () => {
    // 9 PM Pacific = 5 AM UTC next day (during PST)
    vi.setSystemTime(new Date("2024-01-15T05:00:00Z"));
    mockEnv.SMS_ENABLED = true;

    expect.assertions(3);
    try {
      validateSmsAllowed();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("FORBIDDEN");
      expect((error as AppError).context).toEqual({ reason: "QUIET_HOURS" });
    }
  });

  it("throws FORBIDDEN when SMS_ENABLED=false", () => {
    // 10 AM Pacific = 6 PM UTC (during PST)
    vi.setSystemTime(new Date("2024-01-15T18:00:00Z"));
    mockEnv.SMS_ENABLED = false;

    expect.assertions(3);
    try {
      validateSmsAllowed();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("FORBIDDEN");
      expect((error as AppError).context).toEqual({ reason: "SMS_DISABLED" });
    }
  });
});

describe("sendGroupMessage", () => {
  const testRecipients = [mockMembers[1], mockMembers[2], mockMembers[3]];
  const defaultInput = {
    groupIds: [5],
    subject: "Test Subject",
    body: "Test Body",
    sendEmail: true,
    sendSms: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.EMAIL_ENABLED = true;
    mockEnv.SMS_ENABLED = false;
    mockInteractiveTransaction();
  });

  it("creates Message record with correct data", async () => {
    vi.mocked(getGroupRecipients).mockResolvedValue([100002, 100003, 100004]);
    vi.mocked(getMemberDetails).mockResolvedValue(testRecipients);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 3, failed: 0, suppressed: 0, results: [] });
    mockPrisma.message.create.mockResolvedValue({ ...testMessage, id: 1 });
    mockPrisma.messageRecipient.createMany.mockResolvedValue({ count: 3 });
    mockPrisma.messageRecipient.updateMany.mockResolvedValue({ count: 3 });
    mockPrisma.message.update.mockResolvedValue(testMessage);

    const result = await sendGroupMessage(defaultInput, 100001);

    expect(result.messageId).toBe(1);
    expect(mockPrisma.message.create).toHaveBeenCalledWith({
      data: {
        senderId: 100001,
        subject: "Test Subject",
        body: "Test Body",
        emailCount: 3,
        smsCount: 0,
        failedCount: 0,
        isBlast: false,
      },
    });
  });

  it("creates MessageRecipient records for email recipients", async () => {
    vi.mocked(getGroupRecipients).mockResolvedValue([100002, 100003, 100004]);
    vi.mocked(getMemberDetails).mockResolvedValue(testRecipients);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 3, failed: 0, suppressed: 0, results: [] });
    mockPrisma.message.create.mockResolvedValue({ ...testMessage, id: 1 });
    mockPrisma.messageRecipient.createMany.mockResolvedValue({ count: 3 });
    mockPrisma.messageRecipient.updateMany.mockResolvedValue({ count: 3 });
    mockPrisma.message.update.mockResolvedValue(testMessage);

    await sendGroupMessage(defaultInput, 100001);

    expect(mockPrisma.messageRecipient.createMany).toHaveBeenCalledWith({
      data: [
        { messageId: 1, memberId: 100002, channel: "email", status: "pending" },
        { messageId: 1, memberId: 100003, channel: "email", status: "pending" },
        { messageId: 1, memberId: 100004, channel: "email", status: "pending" },
      ],
    });
  });

  it("throws when no delivery method selected", async () => {
    await expect(sendGroupMessage({ ...defaultInput, sendEmail: false, sendSms: false }, 100001)).rejects.toMatchObject(
      {
        code: "VALIDATION_ERROR",
      },
    );
  });

  it("throws when no recipients found", async () => {
    vi.mocked(getGroupRecipients).mockResolvedValue([]);

    await expect(sendGroupMessage(defaultInput, 100001)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("updates failedCount when emails fail", async () => {
    vi.mocked(getGroupRecipients).mockResolvedValue([100002, 100003, 100004]);
    vi.mocked(getMemberDetails).mockResolvedValue(testRecipients);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 1, failed: 2, suppressed: 0, results: [] });
    mockPrisma.message.create.mockResolvedValue({ ...testMessage, id: 1 });
    mockPrisma.messageRecipient.createMany.mockResolvedValue({ count: 3 });
    mockPrisma.messageRecipient.updateMany.mockResolvedValue({ count: 2 });
    mockPrisma.message.update.mockResolvedValue({ ...testMessage, failedCount: 2 });

    const result = await sendGroupMessage(defaultInput, 100001);

    expect(mockPrisma.message.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { failedCount: 2 },
    });
    expect(result.failedCount).toBe(2);
    expect(result.emailCount).toBe(1);
  });
});

describe("sendBlastMessage", () => {
  const allMemberIds = mockMembers.map((m) => m.ownerid);
  const defaultInput = {
    subject: "Blast Message",
    body: "This is a blast message",
    sendEmail: true,
    sendSms: false,
    confirmationText: "SEND TO ALL" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.EMAIL_ENABLED = true;
    mockEnv.SMS_ENABLED = false;
    mockInteractiveTransaction();
  });

  it("creates Message with isBlast=true and no groupId", async () => {
    vi.mocked(getAllActiveMemberIds).mockResolvedValue(allMemberIds);
    vi.mocked(getMemberDetails).mockResolvedValue([...mockMembers]);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 389, failed: 0, suppressed: 0, results: [] });
    mockPrisma.message.create.mockResolvedValue({ ...testBlastMessage, id: 2 });
    mockPrisma.messageRecipient.createMany.mockResolvedValue({ count: 389 });
    mockPrisma.messageRecipient.updateMany.mockResolvedValue({ count: 389 });
    mockPrisma.message.update.mockResolvedValue(testBlastMessage);

    const result = await sendBlastMessage(defaultInput, 100001);

    expect(result.messageId).toBe(2);
    expect(mockPrisma.message.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isBlast: true,
      }),
    });
    const createCall = mockPrisma.message.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(createCall.data).not.toHaveProperty("groupId");
  });

  it("sends to all active members", async () => {
    vi.mocked(getAllActiveMemberIds).mockResolvedValue(allMemberIds);
    vi.mocked(getMemberDetails).mockResolvedValue([...mockMembers]);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 389, failed: 0, suppressed: 0, results: [] });
    mockPrisma.message.create.mockResolvedValue({ ...testBlastMessage, id: 2 });
    mockPrisma.messageRecipient.createMany.mockResolvedValue({ count: 389 });
    mockPrisma.messageRecipient.updateMany.mockResolvedValue({ count: 389 });
    mockPrisma.message.update.mockResolvedValue(testBlastMessage);

    await sendBlastMessage(defaultInput, 100001);

    expect(getAllActiveMemberIds).toHaveBeenCalled();
    expect(getMemberDetails).toHaveBeenCalledWith(allMemberIds);
  });

  it("updates failedCount when emails fail", async () => {
    vi.mocked(getAllActiveMemberIds).mockResolvedValue(allMemberIds);
    vi.mocked(getMemberDetails).mockResolvedValue([...mockMembers]);
    vi.mocked(sendGroupEmails).mockResolvedValue({ sent: 350, failed: 39, suppressed: 0, results: [] });
    mockPrisma.message.create.mockResolvedValue({ ...testBlastMessage, id: 2 });
    mockPrisma.messageRecipient.createMany.mockResolvedValue({ count: 389 });
    mockPrisma.messageRecipient.updateMany.mockResolvedValue({ count: 39 });
    mockPrisma.message.update.mockResolvedValue({ ...testBlastMessage, failedCount: 39 });

    const result = await sendBlastMessage(defaultInput, 100001);

    expect(mockPrisma.message.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { failedCount: 39 },
    });
    expect(result.failedCount).toBe(39);
    expect(result.emailCount).toBe(350);
  });
});
