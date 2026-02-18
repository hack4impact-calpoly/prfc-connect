import { vi, type MockedFunction } from "vitest";
import { AppError, transformError } from "@/utils/errors";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: vi.fn(),
}));

vi.mock("@/services/contact-group", () => ({
  isGroupOwner: vi.fn(),
  getGroupById: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  addMembersToGroup: vi.fn(),
}));

vi.mock("@/services/message", () => ({
  sendGroupMessage: vi.fn(),
  sendBlastMessage: vi.fn(),
}));

import { verifySession } from "@/lib/dal";
import { isGroupOwner, getGroupById, updateGroup, deleteGroup, addMembersToGroup } from "@/services/contact-group";
import { sendGroupMessage, sendBlastMessage } from "@/services/message";
import { updateContactGroup, deleteContactGroup, addMembers, sendMessage, sendBlast } from "@/actions/contact-group";

const mockVerifySession = verifySession as MockedFunction<typeof verifySession>;
const mockIsGroupOwner = isGroupOwner as MockedFunction<typeof isGroupOwner>;
const mockGetGroupById = getGroupById as MockedFunction<typeof getGroupById>;
const mockUpdateGroup = updateGroup as MockedFunction<typeof updateGroup>;
const mockDeleteGroup = deleteGroup as MockedFunction<typeof deleteGroup>;
const mockAddMembersToGroup = addMembersToGroup as MockedFunction<typeof addMembersToGroup>;
const mockSendGroupMessage = sendGroupMessage as MockedFunction<typeof sendGroupMessage>;
const mockSendBlastMessage = sendBlastMessage as MockedFunction<typeof sendBlastMessage>;

function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

function statusFromAction(result: { success: boolean; error?: string }): number {
  if (result.success) return 200;
  if (result.error?.includes("Authentication required") || result.error?.includes("Invalid or expired token")) {
    return 401;
  }
  return 403;
}

// Helper function to simulate viewing a contact group
async function viewContactGroup(
  groupId: number,
): Promise<{ success: true; data: unknown } | { success: false; error: string }> {
  try {
    const session = await verifySession();

    if (!session.isAdmin && !(await isGroupOwner(groupId, session.ownerid))) {
      return { success: false, error: "You do not have permission to view this group" };
    }

    const group = await getGroupById(groupId);
    return { success: true, data: group };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

describe("authorization boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Owner can view own group (200)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);
    mockGetGroupById.mockResolvedValue({ id: 3 } as never); // Just need an object, details don't matter for this test

    const result = await viewContactGroup(3);

    expect(statusFromAction(result)).toBe(200);
  });

  it("Owner can edit own group (200)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);
    mockUpdateGroup.mockResolvedValue({ id: 3 } as never);

    const result = await updateContactGroup(3, createFormData({ name: "Updated", description: "Desc" }));

    expect(statusFromAction(result)).toBe(200);
    expect(mockUpdateGroup).toHaveBeenCalledWith(3, { name: "Updated", description: "Desc" });
  });

  it("Owner can delete own group (200)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);

    const result = await deleteContactGroup(3);

    expect(statusFromAction(result)).toBe(200);
    expect(mockDeleteGroup).toHaveBeenCalledWith(3);
  });

  it("Owner can message own group (200)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);
    mockSendGroupMessage.mockResolvedValue({ messageId: 1, emailCount: 1, smsCount: 0, failedCount: 0 });

    const result = await sendMessage({
      groupId: 3,
      subject: "Subject",
      body: "Body",
      sendEmail: true,
      sendSms: false,
    });

    expect(statusFromAction(result)).toBe(200);
  });

  it("Non-owner gets 403 on view (not 404)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 20, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(false);

    const result = await viewContactGroup(3);

    expect(statusFromAction(result)).toBe(403);
    if (result.success) {
      throw new Error("Expected forbidden result for non-owner view");
    }
    expect(result.error.toLowerCase()).not.toContain("not found");
    expect(mockGetGroupById).not.toHaveBeenCalled();
  });

  it("Non-owner gets 403 on edit", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 20, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(false);

    const result = await updateContactGroup(3, createFormData({ name: "Blocked", description: "Nope" }));

    expect(statusFromAction(result)).toBe(403);
  });

  it("Non-owner gets 403 on delete", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 20, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(false);

    const result = await deleteContactGroup(3);

    expect(statusFromAction(result)).toBe(403);
  });

  it("Non-owner gets 403 on message", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 20, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(false);

    const result = await sendMessage({
      groupId: 3,
      subject: "Blocked",
      body: "Body",
      sendEmail: true,
      sendSms: false,
    });

    expect(statusFromAction(result)).toBe(403);
  });

  it("Non-owner gets 403 on addMembers", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 20, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(false);

    const result = await addMembers({
      groupId: 3,
      members: [{ memberId: 101, notifyEmail: true, notifySms: false }],
    });

    expect(statusFromAction(result)).toBe(403);
  });

  it("Admin can view any group (200)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });
    mockGetGroupById.mockResolvedValue({ id: 3 } as never);

    const result = await viewContactGroup(3);

    expect(statusFromAction(result)).toBe(200);
    expect(mockIsGroupOwner).not.toHaveBeenCalled();
  });

  it("Admin can edit any group (200)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });
    mockUpdateGroup.mockResolvedValue({ id: 3 } as never);

    const result = await updateContactGroup(3, createFormData({ name: "Admin", description: "Edit" }));

    expect(statusFromAction(result)).toBe(200);
    expect(mockIsGroupOwner).not.toHaveBeenCalled();
  });

  it("Admin can delete any group (200)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });

    const result = await deleteContactGroup(3);

    expect(statusFromAction(result)).toBe(200);
    expect(mockIsGroupOwner).not.toHaveBeenCalled();
  });

  it("Admin can message any group (200)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });
    mockSendGroupMessage.mockResolvedValue({ messageId: 1, emailCount: 1, smsCount: 0, failedCount: 0 });

    const result = await sendMessage({
      groupId: 3,
      subject: "Admin",
      body: "Message",
      sendEmail: true,
      sendSms: false,
    });

    expect(statusFromAction(result)).toBe(200);
    expect(mockIsGroupOwner).not.toHaveBeenCalled();
  });

  it("Admin can send blast (200)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });
    mockSendBlastMessage.mockResolvedValue({ messageId: 2, emailCount: 10, smsCount: 0, failedCount: 0 });

    const result = await sendBlast({
      subject: "Blast",
      body: "Body",
      sendEmail: true,
      sendSms: false,
      confirmationText: "SEND TO ALL",
    });

    expect(statusFromAction(result)).toBe(200);
  });

  it("Non-admin cannot send blast (403)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 20, isAdmin: false });

    const result = await sendBlast({
      subject: "Blast",
      body: "Body",
      sendEmail: true,
      sendSms: false,
      confirmationText: "SEND TO ALL",
    });

    expect(statusFromAction(result)).toBe(403);
  });

  it("Admin can add members to any group (200)", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });
    mockAddMembersToGroup.mockResolvedValue({ count: 1 });

    const result = await addMembers({
      groupId: 3,
      members: [{ memberId: 101, notifyEmail: true, notifySms: false }],
    });

    expect(statusFromAction(result)).toBe(200);
    expect(mockIsGroupOwner).not.toHaveBeenCalled();
  });

  it("Expired token returns 401", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Invalid or expired token"));

    const result = await sendMessage({
      groupId: 3,
      subject: "Subject",
      body: "Body",
      sendEmail: true,
      sendSms: false,
    });

    expect(statusFromAction(result)).toBe(401);
  });

  it("Missing token returns 401", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const result = await deleteContactGroup(3);

    expect(statusFromAction(result)).toBe(401);
  });

  it("Tampered token returns 401", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Invalid or expired token"));

    const result = await viewContactGroup(3);

    expect(statusFromAction(result)).toBe(401);
  });
});
