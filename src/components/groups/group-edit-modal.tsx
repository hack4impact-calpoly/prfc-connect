import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Loader2, Plus } from "lucide-react";

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
  onSave: (data: { name: string; description: string | null }) => void;
  onDelete: () => void;
  onAddMembers: () => void;
  isSubmitting?: boolean;
}

export function GroupEditModal({
  open,
  onOpenChange,
  group,
  onSave,
  onDelete,
  onAddMembers,
  isSubmitting = false,
}: GroupEditModalProps) {
  const [newName, setNewName] = useState(group.name);
  const [newDescription, setNewDescription] = useState(group.description || "");

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (!nextOpen) {
      setNewName("");
      setNewDescription("");
    }
    onOpenChange(nextOpen);
  };

  const handleSave = (newData: { name: string; description: string | null }) => {
    if (isSubmitting) return;
    onSave(newData);
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
            onClick={onDelete}
            className="
              justify-self-end
              bg-transparent
              border-none
              p-0
              text-[#831002]
              hover:underline
              hover:bg-transparent
              cursor-pointer
              shadow-none
            "
          >
            Delete
          </Button>
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="groupName" className="font-bold">
              Group Name
            </label>
            <Input type="text" id="groupName" defaultValue={newName} />
          </div>
          <div id="Editable Fields" className="grid grid-cols-1 gap-2">
            <label htmlFor="description" className="font-bold">
              Description (Optional)
            </label>
            <Textarea id="description" defaultValue={newDescription} />
          </div>
          <div id="Members Section" className="flex items-center gap-4">
            <label htmlFor="addMember" className="font-bold">
              Add Members
            </label>
            <Button
              id="addMember"
              onClick={onAddMembers}
              className="bg-slate-300 rounded-xl h-6 border-2 border-zinc-950"
            >
              <Plus color="black" />
            </Button>
          </div>
          <div id="avatarRow" className="flex gap-2">
            {group.members.slice(0, 8).map((member) => (
              <div key={member.memberId} className="bg-slate-300 h-8 w-8 rounded-full" />
            ))}
            {group.memberCount > 8 ? (
              <div className="bg-slate-300 h-8 w-8 rounded-full">+ {group.memberCount - 8}</div>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => handleSave({ name: newName, description: newDescription })}
            className="bg-[#523019] rounded-xl p-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
