import { Lock, Undo2, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/utils/avatar";

interface GroupMemberTableProps {
  members: Array<{
    memberId: number;
    ownername: string;
    owneremail: string;
    photoUrl?: string | null;
  }>;
  mode: "view" | "edit";
  removedIds?: Set<number>;
  onRemove?: (memberId: number) => void;
  onRestore?: (memberId: number) => void;
}

export function GroupMemberTable({ members, mode, removedIds, onRemove, onRestore }: GroupMemberTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="w-[100px]">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const isRemoved = removedIds?.has(member.memberId) ?? false;
          return (
            <TableRow key={member.memberId} className={cn(isRemoved && "opacity-40")}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {member.photoUrl && <AvatarImage src={member.photoUrl} alt={member.ownername} />}
                    <AvatarFallback
                      style={{ backgroundColor: getAvatarColor(member.ownername) }}
                      className="text-xs font-semibold text-white"
                    >
                      {getInitials(member.ownername)}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn("text-base", isRemoved && "line-through")}>{member.ownername}</span>
                </div>
              </TableCell>
              <TableCell className={cn("text-base", isRemoved && "line-through")}>{member.owneremail}</TableCell>
              <TableCell className="text-base">Member</TableCell>
              <TableCell>
                {mode === "view" ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : isRemoved ? (
                  <button
                    type="button"
                    onClick={() => onRestore?.(member.memberId)}
                    aria-label={`Restore ${member.ownername}`}
                    className="flex items-center gap-2 text-base font-semibold text-prfc-brown hover:text-prfc-brown/80"
                  >
                    <Undo2 className="h-4 w-4" />
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRemove?.(member.memberId)}
                    aria-label={`Remove ${member.ownername}`}
                    className="flex items-center gap-2 text-base font-semibold text-prfc-red hover:text-prfc-red/80"
                  >
                    <UserMinus className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
