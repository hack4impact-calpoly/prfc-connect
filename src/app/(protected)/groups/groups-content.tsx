"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityCard } from "@/components/groups/entity-card";
import { GroupEditModal } from "@/components/groups/group-edit-modal";
import { CreateGroupModal } from "@/components/groups/create-group-modal";
import { DeleteGroupModal } from "@/components/groups/delete-group-modal";
import { useGroupsModal, EMPTY_GROUP } from "@/components/groups/use-groups-modal";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { cn } from "@/lib/utils";
import type { GroupWithCount } from "@/services/contact-group";
import type { MemberSummary } from "@/lib/api/member-api";

interface GroupsContentProps {
  myGroups: GroupWithCount[];
  allGroups: GroupWithCount[];
  isAdmin: boolean;
  ownerId: number;
  members: MemberSummary[];
}

export function GroupsContent({ myGroups, allGroups, isAdmin, ownerId, members }: GroupsContentProps) {
  const router = useRouter();
  const [view, setView] = useState<"my" | "all">("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("all");
  const searchParams = useSearchParams();
  const {
    modal,
    isPending,
    loadingGroupId,
    openCreateModal,
    closeModal,
    handleQuickEdit,
    handleQuickDelete,
    handleSave,
    handleConfirmDelete,
    handleCreateSubmit,
    handleDeleteCancel,
  } = useGroupsModal(ownerId, searchParams.get("create") === "true");

  const ownerNameMap = useMemo(() => new Map(members.map((m) => [m.ownerid, m.ownername])), [members]);
  const groups = view === "all" ? allGroups : myGroups;
  const groupsWithOwner = useMemo(
    () => groups.map((g) => ({ ...g, ownerName: ownerNameMap.get(g.ownerid) ?? "" })),
    [groups, ownerNameMap],
  );
  const filteredGroups = useFuzzySearch(groupsWithOwner, { keys: ["name", "description", "ownerName"] }, searchQuery);

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "members") return b.memberCount - a.memberCount;
    if (sortBy === "date") return b.createdAt.getTime() - a.createdAt.getTime();
    return 0;
  });

  return (
    <div>
      <h1 className="font-angkor text-3xl text-prfc-brown">Groups</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {isAdmin && (
          <div className="flex rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setView("my")}
              className={cn(
                "rounded-l-lg px-4 py-2 text-sm font-medium transition-colors",
                view === "my" ? "bg-prfc-brown text-white" : "text-muted-foreground hover:bg-muted",
              )}
            >
              My Groups
            </button>
            <button
              type="button"
              onClick={() => setView("all")}
              className={cn(
                "rounded-r-lg px-4 py-2 text-sm font-medium transition-colors",
                view === "all" ? "bg-prfc-brown text-white" : "text-muted-foreground hover:bg-muted",
              )}
            >
              All Groups
            </button>
          </div>
        )}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="pl-9"
            aria-label="Search groups"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="members">Members</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openCreateModal} className="ml-auto bg-prfc-red text-white hover:bg-prfc-red/90">
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="mt-6">
        {groups.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">
            {view === "my" ? "You are not a member of any groups yet." : "No groups have been created yet."}
          </p>
        ) : sortedGroups.length === 0 ? (
          <p className="text-muted-foreground">No groups match your search.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1920px]:grid-cols-5">
            {sortedGroups.map((group) => (
              <div key={group.id} className="relative">
                <EntityCard
                  variant="group"
                  name={group.name}
                  memberCount={group.memberCount}
                  createdAt={group.createdAt}
                  onViewGroup={() => router.push(`/groups/${group.id}`)}
                  onQuickEdit={() => handleQuickEdit(group.id)}
                  onDelete={() => handleQuickDelete(group.id)}
                />
                {loadingGroupId === group.id ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-prfc-brown border-t-transparent" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <GroupEditModal
        key={modal.type === "edit" ? modal.group.id : "closed"}
        open={modal.type === "edit"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        group={modal.type === "edit" ? modal.group : EMPTY_GROUP}
        onSave={handleSave}
        isSubmitting={modal.type === "edit" && isPending}
      />

      <CreateGroupModal
        open={modal.type === "create"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        onSubmit={handleCreateSubmit}
        members={members.map((m) => ({ memberId: m.ownerid, ownername: m.ownername }))}
        isSubmitting={modal.type === "create" && isPending}
      />

      <DeleteGroupModal
        open={modal.type === "delete"}
        onOpenChange={(open) => {
          if (!open) handleDeleteCancel();
        }}
        groupName={modal.type === "delete" ? modal.group.name : ""}
        onConfirm={handleConfirmDelete}
        isDeleting={modal.type === "delete" && isPending}
      />
    </div>
  );
}
