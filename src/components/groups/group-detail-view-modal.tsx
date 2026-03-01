import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";

interface GroupEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: number;
    name: string;
    description: string | null;
    members: Array<{ memberId: number; ownername: string }>;
    memberCount: number;
  };
  onEdit: () => void;
  onViewAllMembers: () => void;
}

export function GroupDetailViewModal({ open, onOpenChange, group, onEdit, onViewAllMembers }: GroupEditModalProps) {
  const [newName, setNewName] = useState(group.name);
  const [newDescription, setNewDescription] = useState(group.description || "");

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>
          <DialogHeader className="text-[#523019] text-4xl font-black">My Groups</DialogHeader>
        </DialogTitle>
        <div className="grid grid-cols-1 justify-items-stretch gap-4">
          <Button
            type="button"
            onClick={onEdit}
            className="
              justify-self-end
              bg-transparent
              border-none
              p-0
              hover:underline
              hover:bg-transparent
              cursor-pointer
              shadow-none
            "
          >
            Edit
          </Button>
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="groupName" className="font-bold">
              Group Name
            </label>
            <Input type="text" id="groupName" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div id="Editable Fields" className="grid grid-cols-1 gap-2">
            <label htmlFor="description" className="font-bold">
              Description (Optional)
            </label>
            <Textarea id="description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          </div>
          <div id="Members Section" className="flex items-center gap-4">
            <label htmlFor="addMember" className="font-bold">
              Members
            </label>
            <Button
              id="addMember"
              onClick={onViewAllMembers}
              className="bg-slate-300 rounded-xl h-6 border-2 border-zinc-950"
            >
              View All
            </Button>
          </div>
          <div id="avatarRow" className="flex gap-2">
            {group.members.slice(0, 8).map((member) => (
              <div key={member.memberId} className="bg-slate-300 h-8 w-8 rounded-full" />
            ))}
            {group.memberCount > 8 ? (
              <div className="bg-slate-300 h-8 w-8 rounded-full font-bold text-md flex justify-center items-center ">
                +{group.memberCount - 8}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
