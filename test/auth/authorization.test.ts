import "../mocks/next-cache";
import "../mocks/dal";
import "../mocks/contact-group-service";
import {
  mockVerifySession,
  mockIsGroupOwner,
  mockDeleteGroup,
  mockAddMembersToGroup,
  mockRemoveMemberFromGroup,
  mockUpdateMemberNotifications,
} from "../mocks";
import { deleteContactGroup, addMembers, removeMember, updateNotifications } from "@/actions/contact-group";

describe("authorization boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deleteContactGroup", () => {
    it("allows admin to delete any group without owner check", async () => {
      mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });

      const result = await deleteContactGroup(7);

      expect(result.success).toBe(true);
      expect(mockDeleteGroup).toHaveBeenCalledWith(7);
      expect(mockIsGroupOwner).not.toHaveBeenCalled();
    });
  });

  describe("addMembers", () => {
    it("allows admin to add members without owner check", async () => {
      mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });
      mockAddMembersToGroup.mockResolvedValue({ count: 1 });

      const result = await addMembers({
        groupId: 3,
        members: [{ memberId: 101, notifyEmail: true, notifySms: false }],
      });

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(1);
      expect(mockIsGroupOwner).not.toHaveBeenCalled();
    });
  });

  describe("removeMember", () => {
    it("allows admin to remove member without owner check", async () => {
      mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });

      const result = await removeMember(3, 101);

      expect(result.success).toBe(true);
      expect(mockRemoveMemberFromGroup).toHaveBeenCalledWith(3, 101);
      expect(mockIsGroupOwner).not.toHaveBeenCalled();
    });
  });

  describe("updateNotifications", () => {
    it("allows admin to update notifications without owner check", async () => {
      mockVerifySession.mockResolvedValue({ ownerid: 99, isAdmin: true });

      const result = await updateNotifications({
        groupId: 3,
        memberId: 101,
        notifyEmail: false,
      });

      expect(result.success).toBe(true);
      expect(mockUpdateMemberNotifications).toHaveBeenCalledWith(3, 101, {
        notifyEmail: false,
        notifySms: undefined,
      });
      expect(mockIsGroupOwner).not.toHaveBeenCalled();
    });

    it("rejects non-owner non-admin notification updates", async () => {
      mockVerifySession.mockResolvedValue({ ownerid: 20, isAdmin: false });
      mockIsGroupOwner.mockResolvedValue(false);

      const result = await updateNotifications({
        groupId: 3,
        memberId: 101,
        notifyEmail: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("do not have permission");
      expect(mockUpdateMemberNotifications).not.toHaveBeenCalled();
    });
  });
});
