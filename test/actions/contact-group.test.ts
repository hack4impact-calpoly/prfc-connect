import "../mocks/next-cache";
import "../mocks/dal";
import "../mocks/contact-group-service";
import "../mocks/message-service";

import { AppError } from "@/utils/errors";
import {
  mockVerifySession,
  mockRevalidatePath,
  mockCreateGroup,
  mockUpdateGroup,
  mockDeleteGroup,
  mockIsGroupOwner,
  mockAddMembersToGroup,
  mockRemoveMemberFromGroup,
  mockUpdateMemberNotifications,
  mockSendGroupMessage,
  mockSendBlastMessage,
} from "../mocks";
import {
  createContactGroup,
  updateContactGroup,
  deleteContactGroup,
  addMembers,
  removeMember,
  updateNotifications,
  sendMessage,
  sendBlast,
} from "@/actions/contact-group";

function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

describe("createContactGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies session, creates group, and revalidates", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockCreateGroup.mockResolvedValue({
      id: 55,
      name: "Neighbors",
      description: "Local list",
      ownerid: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createContactGroup({ name: "Neighbors", description: "Local list" });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(55);
    expect(mockVerifySession).toHaveBeenCalled();
    expect(mockCreateGroup).toHaveBeenCalledWith({ name: "Neighbors", description: "Local list" }, 10);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups");
  });

  it("creates group and adds members when memberIds are provided", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockCreateGroup.mockResolvedValue({
      id: 55,
      name: "Neighbors",
      description: null,
      ownerid: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockAddMembersToGroup.mockResolvedValue({ count: 2 });

    const result = await createContactGroup({ name: "Neighbors", description: null, memberIds: [100001, 100002] });

    expect(result.success).toBe(true);
    expect(mockAddMembersToGroup).toHaveBeenCalledWith(
      55,
      [
        { memberId: 100001, notifyEmail: true, notifySms: false },
        { memberId: 100002, notifyEmail: true, notifySms: false },
      ],
      10,
    );
  });

  it("skips addMembersToGroup when memberIds is empty", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockCreateGroup.mockResolvedValue({
      id: 55,
      name: "Solo",
      description: null,
      ownerid: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await createContactGroup({ name: "Solo", description: null, memberIds: [] });

    expect(mockAddMembersToGroup).not.toHaveBeenCalled();
  });

  it("returns validation error when data is invalid", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });

    const result = await createContactGroup({ name: "", description: "Local list" });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mockCreateGroup).not.toHaveBeenCalled();
  });

  it("returns error when session verification fails", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const result = await createContactGroup({ name: "Neighbors", description: "Local list" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Authentication required");
  });
});

describe("updateContactGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows owner to update group", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);
    mockUpdateGroup.mockResolvedValue({
      id: 5,
      name: "Updated",
      description: "Updated desc",
      ownerid: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = createFormData({ name: "Updated", description: "Updated desc" });
    const result = await updateContactGroup(5, formData);

    expect(result.success).toBe(true);
    expect(mockUpdateGroup).toHaveBeenCalledWith(5, { name: "Updated", description: "Updated desc" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups/5");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups");
  });

  it("allows admin to update group without owner check", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });
    mockUpdateGroup.mockResolvedValue({
      id: 5,
      name: "Admin Updated",
      description: null,
      ownerid: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = createFormData({ name: "Admin Updated", description: "" });
    const result = await updateContactGroup(5, formData);

    expect(result.success).toBe(true);
    expect(mockIsGroupOwner).not.toHaveBeenCalled();
  });

  it("rejects non-owner non-admin updates", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(false);

    const formData = createFormData({ name: "Blocked", description: "Nope" });
    const result = await updateContactGroup(5, formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("do not have permission");
    expect(mockUpdateGroup).not.toHaveBeenCalled();
  });
});

describe("deleteContactGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows owner to delete group", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);

    const result = await deleteContactGroup(7);

    expect(result.success).toBe(true);
    expect(mockDeleteGroup).toHaveBeenCalledWith(7);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups");
  });

  it("rejects non-owner non-admin deletes", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(false);

    const result = await deleteContactGroup(7);

    expect(result.success).toBe(false);
    expect(result.error).toContain("do not have permission");
    expect(mockDeleteGroup).not.toHaveBeenCalled();
  });
});

describe("addMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds members when authorized", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);
    mockAddMembersToGroup.mockResolvedValue({ count: 2 });

    const input = {
      groupId: 3,
      members: [
        { memberId: 101, notifyEmail: true, notifySms: false },
        { memberId: 102, notifyEmail: true, notifySms: true },
      ],
    };
    const result = await addMembers(input);

    expect(result.success).toBe(true);
    expect(result.data?.count).toBe(2);
    expect(mockAddMembersToGroup).toHaveBeenCalledWith(3, input.members, 10);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups/3");
  });

  it("rejects non-owner non-admin adds", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(false);

    const result = await addMembers({
      groupId: 3,
      members: [{ memberId: 101, notifyEmail: true, notifySms: false }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("do not have permission");
    expect(mockAddMembersToGroup).not.toHaveBeenCalled();
  });
});

describe("removeMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes member when authorized", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);

    const result = await removeMember(3, 101);

    expect(result.success).toBe(true);
    expect(mockRemoveMemberFromGroup).toHaveBeenCalledWith(3, 101);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups/3");
  });

  it("rejects non-owner non-admin removes", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(false);

    const result = await removeMember(3, 101);

    expect(result.success).toBe(false);
    expect(result.error).toContain("do not have permission");
    expect(mockRemoveMemberFromGroup).not.toHaveBeenCalled();
  });
});

describe("updateNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates notification preferences when authorized", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);

    const result = await updateNotifications({
      groupId: 3,
      memberId: 101,
      notifyEmail: false,
    });

    expect(result.success).toBe(true);
    expect(mockUpdateMemberNotifications).toHaveBeenCalledWith(3, 101, { notifyEmail: false, notifySms: undefined });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups/3");
  });

  it("returns validation error when no preferences provided", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);

    const result = await updateNotifications({ groupId: 3, memberId: 101 });

    expect(result.success).toBe(false);
    expect(result.error).toContain("At least one notification preference");
    expect(mockUpdateMemberNotifications).not.toHaveBeenCalled();
  });
});

describe("sendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const messageResult = { messageId: 22, emailCount: 3, smsCount: 0, failedCount: 0, queuedCount: 0 };

  it("allows owner to send group message", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);
    mockSendGroupMessage.mockResolvedValue(messageResult);

    const result = await sendMessage({
      groupIds: [3],
      subject: "Hello",
      body: "Body text",
      sendEmail: true,
      sendSms: false,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(messageResult);
    expect(mockSendGroupMessage).toHaveBeenCalledWith(
      {
        groupIds: [3],
        subject: "Hello",
        body: "Body text",
        sendEmail: true,
        sendSms: false,
      },
      10,
    );
  });

  it("allows admin to send group message", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });
    mockSendGroupMessage.mockResolvedValue(messageResult);

    const result = await sendMessage({
      groupIds: [3],
      subject: "Admin",
      body: "Admin body",
      sendEmail: true,
      sendSms: false,
    });

    expect(result.success).toBe(true);
    expect(mockIsGroupOwner).not.toHaveBeenCalled();
  });

  it("rejects non-owner non-admin sends", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(false);

    const result = await sendMessage({
      groupIds: [3],
      subject: "Nope",
      body: "Body text",
      sendEmail: true,
      sendSms: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("do not have permission");
    expect(mockSendGroupMessage).not.toHaveBeenCalled();
  });

  it("returns validation error for invalid input", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);

    const result = await sendMessage({
      groupIds: [3],
      subject: "",
      body: "Body text",
      sendEmail: true,
      sendSms: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mockSendGroupMessage).not.toHaveBeenCalled();
  });

  it("returns error when service throws", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });
    mockIsGroupOwner.mockResolvedValue(true);
    mockSendGroupMessage.mockRejectedValue(new AppError("MESSAGE_SEND_FAILED", "Email delivery failed"));

    const result = await sendMessage({
      groupIds: [3],
      subject: "Hello",
      body: "Body text",
      sendEmail: true,
      sendSms: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Email delivery failed");
  });
});

describe("sendBlast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const messageResult = { messageId: 33, emailCount: 10, smsCount: 0, failedCount: 0, queuedCount: 0 };

  it("allows admin to send blast message", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });
    mockSendBlastMessage.mockResolvedValue(messageResult);

    const result = await sendBlast({
      subject: "Update",
      body: "Blast body",
      sendEmail: true,
      sendSms: false,
      confirmationText: "SEND TO ALL",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(messageResult);
    expect(mockSendBlastMessage).toHaveBeenCalledWith(
      {
        subject: "Update",
        body: "Blast body",
        sendEmail: true,
        sendSms: false,
        confirmationText: "SEND TO ALL",
      },
      99,
    );
  });

  it("rejects non-admin blast sends", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 10, isAdmin: false });

    const result = await sendBlast({
      subject: "Update",
      body: "Blast body",
      sendEmail: true,
      sendSms: false,
      confirmationText: "SEND TO ALL",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("do not have permission");
    expect(mockSendBlastMessage).not.toHaveBeenCalled();
  });

  it("returns validation error for invalid confirmation text", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });

    const result = await sendBlast({
      subject: "Update",
      body: "Blast body",
      sendEmail: true,
      sendSms: false,
      confirmationText: "WRONG TEXT" as "SEND TO ALL",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mockSendBlastMessage).not.toHaveBeenCalled();
  });

  it("returns error when service throws", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });
    mockSendBlastMessage.mockRejectedValue(new AppError("MESSAGE_SEND_FAILED", "Blast delivery failed"));

    const result = await sendBlast({
      subject: "Update",
      body: "Blast body",
      sendEmail: true,
      sendSms: false,
      confirmationText: "SEND TO ALL",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Blast delivery failed");
  });
});
