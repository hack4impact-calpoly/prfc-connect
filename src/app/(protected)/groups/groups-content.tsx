"use client";

import { EntityCard } from "@/components/groups/entity-card";
import { GroupDetailViewModal } from "@/components/groups/group-detail-view-modal";
import { GroupEditModal } from "@/components/groups/group-edit-modal";
import { CreateGroupModal } from "@/components/groups/create-group-modal";
import { DeleteGroupModal } from "@/components/groups/delete-group-modal";
import { AddMembersModal } from "@/components/groups/add-members-modal";
import { useSetTopBarAction } from "@/components/layout/top-bar-action-context";
import { useGroupsModal, EMPTY_GROUP } from "@/hooks/use-groups-modal";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import type { GroupWithCount } from "@/services/contact-group";

interface GroupsContentProps {
  groups: GroupWithCount[];
  isAdmin: boolean;
  ownerId: number;
}

export function GroupsContent({ groups, isAdmin, ownerId }: GroupsContentProps) {
  const {
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
  } = useGroupsModal(ownerId);

  useSetTopBarAction("New Group", openCreateModal);

  const filteredGroups = useFuzzySearch(groups, {
    keys: ["name", "description"],
  });
  const isSearchActive = filteredGroups.length !== groups.length;

  return (
    <div>
      <h1 className="font-angkor text-2xl text-prfc-brown mb-6">{isAdmin ? "Groups" : "My Groups"}</h1>

      {filteredGroups.length === 0 && groups.length > 0 ? (
        <p className="text-muted-foreground">No groups match your search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredGroups.map((group) => (
            <div key={group.id} className="relative">
              <EntityCard
                variant="group"
                name={group.name}
                memberCount={group.memberCount}
                onViewGroup={() => handleCardClick(group.id)}
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
          {!isSearchActive ? <EntityCard variant="add" onClick={openCreateModal} /> : null}
        </div>
      )}

      <GroupDetailViewModal
        open={modal.type === "detail"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        group={modal.type === "detail" ? modal.group : EMPTY_GROUP}
        onEdit={handleEdit}
      />

      <GroupEditModal
        key={modal.type === "edit" ? modal.group.id : "closed"}
        open={modal.type === "edit"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        group={modal.type === "edit" ? modal.group : EMPTY_GROUP}
        onSave={handleSave}
        onDelete={handleDelete}
        onAddMembers={handleAddMembersOpen}
        isSubmitting={modal.type === "edit" && isPending}
      />

      <CreateGroupModal
        open={modal.type === "create"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        onSubmit={handleCreateSubmit}
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

      <AddMembersModal
        open={modal.type === "addMembers"}
        onOpenChange={(open) => {
          if (!open) handleAddMembersCancel();
        }}
        groupName={modal.type === "addMembers" ? modal.group.name : ""}
        members={modal.type === "addMembers" ? modal.memberRows : []}
        onSelectionChange={handleSelectionChange}
        onConfirm={handleConfirmAddMembers}
        isSubmitting={modal.type === "addMembers" && isPending}
      />
    </div>
  );
}
