import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
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
  onEdit: () => void;
  onViewAllMembers: () => void;
}

export function GroupDetailViewModal({ open, onOpenChange, group, onEdit, onViewAllMembers }: GroupEditModalProps) {
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
              text-zinc-950
            "
          >
            Edit
          </Button>
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="groupName" className="font-bold">
              Group Name
            </label>
            <Input type="text" id="groupName" defaultValue={group.name} readOnly={true} />
          </div>
          <div id="Editable Fields" className="grid grid-cols-1 gap-2">
            <label htmlFor="description" className="font-bold">
              Description
            </label>
            <Textarea id="description" defaultValue={group.description || ""} readOnly={true} />
          </div>
          <div id="Members Section" className="flex items-center gap-4">
            <label htmlFor="addMember" className="font-bold">
              Members
            </label>
            <Button
              id="addMember"
              onClick={onViewAllMembers}
              className="bg-slate-300 rounded-xl h-6 border-2 border-zinc-950 text-zinc-950 text-xs"
            >
              View All
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
