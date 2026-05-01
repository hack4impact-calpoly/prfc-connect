"use client";

import { handleActionError } from "@/utils/auth-redirect";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import type { MemberRow } from "@/types/group";
import {
  fetchEnrichedGroup,
  createContactGroup,
  updateContactGroup,
  deleteContactGroup,
  addMembers,
  removeMembers,
} from "@/actions/contact-group";
import type { EnrichedGroupData } from "@/types/group";

export const EMPTY_GROUP: EnrichedGroupData = {
  id: 0,
  name: "",
  description: null,
  members: [],
  memberCount: 0,
  ownerName: null,
};

function buildGroupFormData(data: { name: string; description: string | null }): FormData {
  const formData = new FormData();
  formData.set("name", data.name);
  if (data.description) {
    formData.set("description", data.description);
  }
  return formData;
}

export type ModalState =
  | { type: "closed" }
  | { type: "detail"; group: EnrichedGroupData }
  | { type: "edit"; group: EnrichedGroupData }
  | { type: "create" }
  | { type: "delete"; group: EnrichedGroupData }
  | { type: "addMembers"; group: EnrichedGroupData; memberRows: MemberRow[] };

export function useGroupsModal(ownerId: number) {
  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [isPending, startTransition] = useTransition();
  const [loadingGroupId, setLoadingGroupId] = useState<number | null>(null);

  const openCreateModal = useCallback(() => {
    setModal({ type: "create" });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ type: "closed" });
  }, []);

  const handleCardClick = useCallback((groupId: number) => {
    setLoadingGroupId(groupId);
    startTransition(async () => {
      const result = await fetchEnrichedGroup(groupId);
      setLoadingGroupId(null);
      if (result.success && result.data) {
        setModal({ type: "detail", group: result.data });
      } else {
        toast.error(handleActionError(result.error, "Failed to load group details"));
      }
    });
  }, []);

  const handleEdit = useCallback(() => {
    if (modal.type === "detail") {
      setModal({ type: "edit", group: modal.group });
    }
  }, [modal]);

  const handleQuickEdit = useCallback((groupId: number) => {
    setLoadingGroupId(groupId);
    startTransition(async () => {
      const result = await fetchEnrichedGroup(groupId);
      setLoadingGroupId(null);
      if (result.success && result.data) {
        setModal({ type: "edit", group: result.data });
      } else {
        toast.error(handleActionError(result.error, "Failed to load group details"));
      }
    });
  }, []);

  const handleQuickDelete = useCallback((groupId: number) => {
    setLoadingGroupId(groupId);
    startTransition(async () => {
      const result = await fetchEnrichedGroup(groupId);
      setLoadingGroupId(null);
      if (result.success && result.data) {
        setModal({ type: "delete", group: result.data });
      } else {
        toast.error(handleActionError(result.error, "Failed to load group details"));
      }
    });
  }, []);

  const handleSave = useCallback(
    (data: { name: string; description: string | null }) => {
      if (modal.type !== "edit") return;
      const groupId = modal.group.id;

      startTransition(async () => {
        const result = await updateContactGroup(groupId, buildGroupFormData(data));
        if (result.success) {
          toast.success("Group updated successfully");
          setModal({ type: "closed" });
        } else {
          toast.error(handleActionError(result.error, "Failed to update group"));
        }
      });
    },
    [modal],
  );

  const handleDelete = useCallback(() => {
    if (modal.type === "edit") {
      setModal({ type: "delete", group: modal.group });
    }
  }, [modal]);

  const handleConfirmDelete = useCallback(() => {
    if (modal.type !== "delete") return;
    const groupId = modal.group.id;

    startTransition(async () => {
      const result = await deleteContactGroup(groupId);
      if (result.success) {
        toast.success("Group deleted successfully");
        setModal({ type: "closed" });
      } else {
        toast.error(handleActionError(result.error, "Failed to delete group"));
      }
    });
  }, [modal]);

  const handleAddMembersOpen = useCallback(() => {
    if (modal.type !== "edit") return;
    const currentGroup = modal.group;

    startTransition(async () => {
      try {
        const res = await fetch("/api/members");
        if (!res.ok) {
          toast.error("Failed to load members");
          return;
        }

        const allMembers: Array<{ ownerid: number; ownername: string }> = await res.json();
        const currentMemberIds = new Set(currentGroup.members.map((m) => m.memberId));

        const memberRows: MemberRow[] = allMembers.map((m) => ({
          memberId: m.ownerid,
          ownername: m.ownername,
          isOwner: m.ownerid === ownerId,
          isSelected: currentMemberIds.has(m.ownerid),
        }));

        setModal({ type: "addMembers", group: currentGroup, memberRows });
      } catch {
        toast.error("Failed to load members");
      }
    });
  }, [modal, ownerId]);

  const handleSelectionChange = useCallback(
    (memberId: number, selected: boolean) => {
      if (modal.type !== "addMembers") return;

      setModal({
        ...modal,
        memberRows: modal.memberRows.map((row) => (row.memberId === memberId ? { ...row, isSelected: selected } : row)),
      });
    },
    [modal],
  );

  const handleConfirmAddMembers = useCallback(() => {
    if (modal.type !== "addMembers") return;
    const groupId = modal.group.id;
    const currentGroup = modal.group;
    const currentMemberIds = new Set(currentGroup.members.map((m) => m.memberId));

    const newMembers = modal.memberRows
      .filter((row) => row.isSelected && !currentMemberIds.has(row.memberId))
      .map((row) => ({ memberId: row.memberId }));

    const removedMemberIds = modal.memberRows
      .filter((row) => !row.isSelected && currentMemberIds.has(row.memberId))
      .map((row) => row.memberId);

    if (newMembers.length === 0 && removedMemberIds.length === 0) {
      setModal({ type: "edit", group: currentGroup });
      return;
    }

    startTransition(async () => {
      const [addResult, removeResult] = await Promise.all([
        newMembers.length > 0 ? addMembers({ groupId, members: newMembers }) : null,
        removedMemberIds.length > 0 ? removeMembers(groupId, removedMemberIds) : null,
      ]);

      const addFailed = addResult && !addResult.success;
      const removeFailed = removeResult && !removeResult.success;

      if (addFailed || removeFailed) {
        const errors: string[] = [];
        if (addFailed) errors.push(addResult.error ?? "Failed to add members");
        if (removeFailed) errors.push(removeResult.error ?? "Failed to remove members");
        toast.error(errors.join(". "));
      } else {
        const messages: string[] = [];
        if (newMembers.length > 0) messages.push(`Added ${addResult?.data?.count ?? newMembers.length}`);
        if (removedMemberIds.length > 0)
          messages.push(`Removed ${removeResult?.data?.count ?? removedMemberIds.length}`);
        toast.success(`${messages.join(", ")} member(s)`);
      }

      const refreshed = await fetchEnrichedGroup(groupId);
      if (refreshed.success && refreshed.data) {
        setModal({ type: "edit", group: refreshed.data });
      } else {
        setModal({ type: "closed" });
      }
    });
  }, [modal]);

  const handleCreateSubmit = useCallback((data: { name: string; description: string | null; memberIds: number[] }) => {
    startTransition(async () => {
      const result = await createContactGroup({
        name: data.name,
        description: data.description,
        memberIds: data.memberIds.length > 0 ? data.memberIds : undefined,
      });
      if (result.success) {
        toast.success("Group created successfully");
        setModal({ type: "closed" });
      } else {
        toast.error(handleActionError(result.error, "Failed to create group"));
      }
    });
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (modal.type === "delete") {
      setModal({ type: "edit", group: modal.group });
    }
  }, [modal]);

  const handleAddMembersCancel = useCallback(() => {
    if (modal.type === "addMembers") {
      setModal({ type: "edit", group: modal.group });
    }
  }, [modal]);

  return {
    modal,
    isPending,
    loadingGroupId,
    openCreateModal,
    closeModal,
    handleCardClick,
    handleEdit,
    handleQuickEdit,
    handleQuickDelete,
    handleSave,
    handleDelete,
    handleConfirmDelete,
    handleAddMembersOpen,
    handleSelectionChange,
    handleConfirmAddMembers,
    handleCreateSubmit,
    handleDeleteCancel,
    handleAddMembersCancel,
  };
}
