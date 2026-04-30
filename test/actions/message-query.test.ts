import "../mocks/next-cache";
import "../mocks/dal";

import { vi, type MockedFunction } from "vitest";
import { AppError } from "@/utils/errors";
import { mockVerifySession } from "../mocks";

vi.mock("@/services/message", () => ({
  sendGroupMessage: vi.fn(),
  sendBlastMessage: vi.fn(),
  getMessageHistoryPage: vi.fn(),
  getMessageById: vi.fn(),
  getMessageRecipients: vi.fn(),
  previewRecipientCounts: vi.fn(),
}));

vi.mock("@/services/contact-group", () => ({
  isGroupOwner: vi.fn(),
}));

import {
  getMessageHistoryPage,
  getMessageById,
  getMessageRecipients,
  previewRecipientCounts,
} from "@/services/message";
import { isGroupOwner } from "@/services/contact-group";
import { fetchMessageHistoryPage, fetchMessageDetail, fetchRecipientPreview } from "@/actions/contact-group";

const mockGetMessageHistoryPage = getMessageHistoryPage as MockedFunction<typeof getMessageHistoryPage>;
const mockGetMessageById = getMessageById as MockedFunction<typeof getMessageById>;
const mockGetMessageRecipients = getMessageRecipients as MockedFunction<typeof getMessageRecipients>;
const mockPreviewRecipientCounts = previewRecipientCounts as MockedFunction<typeof previewRecipientCounts>;
const mockIsGroupOwner = isGroupOwner as MockedFunction<typeof isGroupOwner>;

describe("fetchMessageDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const messageDetail = {
    id: 1,
    subject: "Hello",
    body: "Body text",
    sentAt: new Date(),
    senderId: 100001,
    emailCount: 5,
    smsCount: 0,
    failedCount: 0,
    isBlast: false,
    groupNames: ["Garden Club"],
  };

  const recipients = [
    { memberId: 100001, memberName: "Kermit Komm", channel: "email", status: "sent", sentAt: new Date() },
  ];

  it("returns message detail with recipients for message sender", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
    mockGetMessageById.mockResolvedValue(messageDetail);
    mockGetMessageRecipients.mockResolvedValue(recipients);

    const result = await fetchMessageDetail(1);

    expect(result).toEqual({ success: true, data: { message: messageDetail, recipients } });
  });

  it("returns message detail for admin regardless of sender", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100099, isAdmin: true });
    mockGetMessageById.mockResolvedValue(messageDetail);
    mockGetMessageRecipients.mockResolvedValue(recipients);

    const result = await fetchMessageDetail(1);

    expect(result.success).toBe(true);
  });

  it("rejects non-sender non-admin access", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100003, isAdmin: false });
    mockGetMessageById.mockResolvedValue(messageDetail);

    const result = await fetchMessageDetail(1);

    expect(result.success).toBe(false);
    expect(result.error).toContain("do not have permission");
    expect(mockGetMessageRecipients).not.toHaveBeenCalled();
  });

  it("returns error when message not found", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: true });
    mockGetMessageById.mockRejectedValue(new AppError("NOT_FOUND", "Message not found"));

    const result = await fetchMessageDetail(999);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Message not found");
  });
});

describe("fetchRecipientPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns counts for group owner", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);
    mockPreviewRecipientCounts.mockResolvedValue({ emailEligible: 10, smsEligible: 6, smsIneligible: 4 });

    const result = await fetchRecipientPreview(1);

    expect(result).toEqual({ success: true, data: { emailEligible: 10, smsEligible: 6, smsIneligible: 4 } });
  });

  it("returns counts for admin without owner check", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100099, isAdmin: true });
    mockPreviewRecipientCounts.mockResolvedValue({ emailEligible: 10, smsEligible: 6, smsIneligible: 4 });

    const result = await fetchRecipientPreview(1);

    expect(result.success).toBe(true);
    expect(mockIsGroupOwner).not.toHaveBeenCalled();
  });

  it("rejects non-owner non-admin access", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100003, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(false);

    const result = await fetchRecipientPreview(1);

    expect(result.success).toBe(false);
    expect(result.error).toContain("do not have permission");
    expect(mockPreviewRecipientCounts).not.toHaveBeenCalled();
  });
});

describe("fetchMessageHistoryPage", () => {
  const mockPage = {
    items: [
      {
        id: 1,
        subject: "Test",
        body: "Body",
        sentAt: new Date(),
        emailCount: 5,
        smsCount: 0,
        failedCount: 0,
        isBlast: false,
        groupNames: ["Garden Club"],
      },
    ],
    totalCount: 1,
    nextCursor: null,
    prevCursor: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated messages for admin without role filter", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: true });
    mockGetMessageHistoryPage.mockResolvedValue(mockPage);

    const result = await fetchMessageHistoryPage({});

    expect(result).toEqual({ success: true, data: mockPage });
    expect(mockGetMessageHistoryPage).toHaveBeenCalledWith({});
  });

  it("filters by recipientId for non-admin member", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100003, isAdmin: false });
    mockGetMessageHistoryPage.mockResolvedValue(mockPage);

    await fetchMessageHistoryPage({});

    expect(mockGetMessageHistoryPage).toHaveBeenCalledWith({ recipientId: 100003 });
  });

  it("rejects invalid pageSize via Zod", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: true });

    const result = await fetchMessageHistoryPage({ pageSize: 30 as never });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const result = await fetchMessageHistoryPage({});

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication required");
  });
});
