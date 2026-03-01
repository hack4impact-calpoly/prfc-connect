import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Loader2, Plus } from "lucide-react";
import { getAvatarColor, getInitials } from "@/utils/avatar";

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

    if (nextOpen) {
      setNewName(group.name);
      setNewDescription(group.description ?? "");
    } else {
      setNewName("");
      setNewDescription("");
    }

    onOpenChange(nextOpen);
  };

  const handleSave = (newData: { name: string; description: string | null }) => {
    if (isSubmitting) return;
    onSave(newData);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSave({
      name: newName,
      description: newDescription.trim() === "" ? null : newDescription,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader className="text-[#523019]">
          <DialogTitle className="text-4xl font-black">{group.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 justify-items-stretch gap-4">
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
            <Input
              type="text"
              id="groupName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="olive-red-100 border-2 border-black"
            />
          </div>

          <div id="Editable Fields" className="grid grid-cols-1 gap-2">
            <label htmlFor="description" className="font-bold">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="olive-red-100 border-2 border-black"
            />
          </div>

          <div id="Members Section" className="flex items-center gap-4">
            <label htmlFor="addMember" className="font-bold">
              Add Members
            </label>
            <Button
              id="addMember"
              type="button"
              onClick={onAddMembers}
              className="bg-slate-300 rounded-xl h-6 border-2 border-zinc-950"
            >
              <Plus color="black" />
            </Button>
          </div>

          <div id="avatarRow" className="flex gap-2">
            {group.members.slice(0, 8).map((member) => (
              <div
                key={member.memberId}
                className={`bg-[${getAvatarColor(member.ownername)}] h-8 w-8 rounded-full flex justify-center items-center text-black`}
              >
                {getInitials(member.ownername)}
              </div>
            ))}
            {group.memberCount > 8 ? (
              <div className="bg-slate-300 h-8 w-8 rounded-full font-bold text-md flex justify-center items-center ">
                +{group.memberCount - 8}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="submit" className="bg-[#523019] rounded-xl p-6" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
