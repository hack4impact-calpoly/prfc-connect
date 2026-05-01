"use client";

import { handleActionError } from "@/utils/auth-redirect";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GroupMemberTable } from "@/components/groups/group-member-table";
import { AddMembersModal, type MemberRow } from "@/components/groups/add-members-modal";
import { addMembers, removeMember } from "@/actions/contact-group";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { useSidebar } from "@/components/layout/sidebar-context";
import type { MemberSummary } from "@/types/member";

type Props = {
  group: {
    id: number;
    name: string;
    description: string | null;
    ownerid: number;
    ownerName: string | null;
    members: Array<{
      memberId: number;
      ownername: string;
      owneremail: string;
    }>;
  };
  allMembers: MemberSummary[];
  currentUserOwnerid: number;
  isAdmin: boolean;
};

export function GroupDetailContent({ group, allMembers, currentUserOwnerid, isAdmin }: Props) {
  const router = useRouter();
  const { width: sidebarWidth } = useSidebar();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [searchQuery, setSearchQuery] = useState("");
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  const filteredMembers = useFuzzySearch(group.members, { keys: ["ownername", "owneremail"] }, searchQuery);

  const memberRows: MemberRow[] = useMemo(() => {
    const currentMemberIds = new Set(group.members.map((m) => m.memberId));
    return allMembers.map((m) => ({
      memberId: m.ownerid,
      ownername: m.ownername,
      isOwner: m.ownerid === group.ownerid,
      isSelected: currentMemberIds.has(m.ownerid),
    }));
  }, [allMembers, group.members, group.ownerid]);

  const [modalMembers, setModalMembers] = useState<MemberRow[]>([]);

  const handleEdit = () => {
    setMode("edit");
    setRemovedIds(new Set());
  };

  const handleRemove = (memberId: number) => {
    setRemovedIds((prev) => new Set(prev).add(memberId));
  };

  const handleRestore = (memberId: number) => {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(memberId);
      return next;
    });
  };

  const handleOpenAddMembers = () => {
    setModalMembers(memberRows);
    setAddMembersOpen(true);
  };

  const handleSelectionChange = (memberId: number, selected: boolean) => {
    setModalMembers((prev) => prev.map((m) => (m.memberId === memberId ? { ...m, isSelected: selected } : m)));
  };

  const handleConfirmAddMembers = () => {
    const currentMemberIds = new Set(group.members.map((m) => m.memberId));
    const newMemberIds = modalMembers
      .filter((m) => m.isSelected && !currentMemberIds.has(m.memberId))
      .map((m) => m.memberId);

    if (newMemberIds.length === 0) {
      setAddMembersOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await addMembers({
        groupId: group.id,
        members: newMemberIds.map((id) => ({ memberId: id })),
      });
      if (result.success) {
        toast.success(`Added ${result.data?.count ?? newMemberIds.length} member(s)`);
        setAddMembersOpen(false);
        router.refresh();
      } else {
        toast.error(handleActionError(result.error, "Failed to add members"));
      }
    });
  };

  const handleSave = () => {
    if (removedIds.size === 0) {
      setMode("view");
      return;
    }

    startTransition(async () => {
      const results = await Promise.all(Array.from(removedIds).map((memberId) => removeMember(group.id, memberId)));
      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        handleActionError(failures[0].error, "");
        toast.error(`Failed to remove ${failures.length} member(s)`);
      } else {
        toast.success(`Removed ${removedIds.size} member(s)`);
      }
      setMode("view");
      setRemovedIds(new Set());
      router.refresh();
    });
  };

  const canEdit = isAdmin || currentUserOwnerid === group.ownerid;

  return (
    <div className={mode === "edit" ? "pb-20" : ""}>
      <Link
        href="/groups"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Go Back
      </Link>

      <h1 className="font-angkor text-3xl text-prfc-brown">{group.name}</h1>
      {group.description && <p className="mt-2 text-muted-foreground">{group.description}</p>}
      {isAdmin && group.ownerName && <p className="mt-1 text-sm text-muted-foreground">Created by {group.ownerName}</p>}

      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="pl-9"
            aria-label="Search members"
          />
        </div>
        <div className="ml-auto">
          {mode === "view" && canEdit && (
            <Button onClick={handleEdit} className="bg-prfc-brown text-white hover:bg-prfc-dark-brown">
              Edit
            </Button>
          )}
          {mode === "edit" && (
            <Button variant="outline" onClick={handleOpenAddMembers} disabled={isPending}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <GroupMemberTable
          members={filteredMembers}
          mode={mode}
          removedIds={removedIds}
          onRemove={handleRemove}
          onRestore={handleRestore}
        />
      </div>

      {mode === "edit" && (
        <div
          style={{ paddingLeft: sidebarWidth + 32 }}
          className="fixed bottom-0 left-0 right-0 z-10 flex justify-end border-t border-prfc-border/30 bg-background px-8 py-4 transition-[padding-left] duration-200 ease-in-out"
        >
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-prfc-brown text-white hover:bg-prfc-dark-brown"
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      )}

      <AddMembersModal
        open={addMembersOpen}
        onOpenChange={setAddMembersOpen}
        members={modalMembers}
        onSelectionChange={handleSelectionChange}
        onConfirm={handleConfirmAddMembers}
        isSubmitting={isPending}
      />
    </div>
  );
}
