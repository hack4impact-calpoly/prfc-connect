import { Lock, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAvatarColor, getInitials } from "@/utils/avatar";

interface GroupMemberTableProps {
  members: Array<{
    memberId: number;
    ownername: string;
    owneremail: string;
    photoUrl?: string | null;
  }>;
  mode: "view" | "edit";
  onRemove?: (memberId: number) => void;
}

export function GroupMemberTable({ members, mode, onRemove }: GroupMemberTableProps) {
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
        {members.map((member) => (
          <TableRow key={member.memberId}>
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
                <span className="text-sm">{member.ownername}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm">{member.owneremail}</TableCell>
            <TableCell className="text-sm">Member</TableCell>
            <TableCell>
              {mode === "view" ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <button
                  type="button"
                  onClick={() => onRemove?.(member.memberId)}
                  aria-label={`Remove ${member.ownername}`}
                  className="flex items-center gap-2 text-sm font-semibold text-prfc-red hover:text-prfc-red/80"
                >
                  <UserMinus className="h-4 w-4" />
                  Remove
                </button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
