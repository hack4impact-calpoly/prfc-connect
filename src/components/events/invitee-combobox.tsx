"use client";

import { useMemo, useState } from "react";
import { ChevronDown, UsersRound, Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { cn } from "@/lib/utils";
import { InviteeAvatarStack, type InviteeAvatar } from "@/components/events/invitee-avatar-stack";

export type GroupOption = {
  id: number;
  name: string;
  memberCount: number;
};

export type MemberOption = {
  ownerid: number;
  ownername: string;
  photoUrl?: string | null;
};

type Props = {
  groups: GroupOption[];
  members: MemberOption[];
  selectedGroupIds: Set<number>;
  selectedMemberIds: Set<number>;
  onToggleGroup: (id: number) => void;
  onToggleMember: (id: number) => void;
};

export function InviteeCombobox({
  groups,
  members,
  selectedGroupIds,
  selectedMemberIds,
  onToggleGroup,
  onToggleMember,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const filteredGroups = useFuzzySearch(groups, { keys: ["name"] }, query);
  const filteredMembers = useFuzzySearch(members, { keys: ["ownername"] }, query);

  const selectedInvitees = useMemo<InviteeAvatar[]>(() => {
    const groupInvitees: InviteeAvatar[] = groups
      .filter((g) => selectedGroupIds.has(g.id))
      .map((g) => ({ id: `g-${g.id}`, name: g.name }));
    const memberInvitees: InviteeAvatar[] = members
      .filter((m) => selectedMemberIds.has(m.ownerid))
      .map((m) => ({ id: `m-${m.ownerid}`, name: m.ownername, photoUrl: m.photoUrl }));
    return [...groupInvitees, ...memberInvitees];
  }, [groups, members, selectedGroupIds, selectedMemberIds]);

  const selectedCount = selectedInvitees.length;
  const noOptions = groups.length === 0 && members.length === 0;

  return (
    <div className="rounded-lg border border-prfc-border/30 bg-paso-grey">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paso-light-brown/40"
      >
        <UsersRound className="h-5 w-5 shrink-0 text-prfc-brown" />
        <span className="flex-1 text-sm">
          {selectedCount > 0 ? (
            <span className="text-foreground">
              {selectedCount} {selectedCount === 1 ? "invitee" : "invitees"} selected
            </span>
          ) : (
            <span className="text-muted-foreground">Add Group/Members</span>
          )}
        </span>
        {selectedCount > 0 && (
          <div className="mr-2">
            <InviteeAvatarStack invitees={selectedInvitees} max={6} />
          </div>
        )}
        <ChevronDown className={cn("h-5 w-5 text-prfc-brown transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="border-t border-prfc-border/30 bg-white">
          {noOptions ? (
            <p className="p-4 text-sm text-muted-foreground">Nothing to invite yet.</p>
          ) : (
            <Command shouldFilter={false}>
              <CommandInput value={query} onValueChange={setQuery} placeholder="Search groups or members..." />
              <CommandList>
                {filteredGroups.length === 0 && filteredMembers.length === 0 && <CommandEmpty>No matches</CommandEmpty>}
                {filteredGroups.length > 0 && (
                  <CommandGroup heading="Groups">
                    {filteredGroups.map((g) => {
                      const isSelected = selectedGroupIds.has(g.id);
                      return (
                        <CommandItem
                          key={`g-${g.id}`}
                          value={`g-${g.id}-${g.name}`}
                          onSelect={() => onToggleGroup(g.id)}
                          className="flex items-center gap-2"
                        >
                          <Check
                            className={cn("h-4 w-4 shrink-0", isSelected ? "text-prfc-brown" : "text-transparent")}
                          />
                          <span className="flex-1">{g.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
                {filteredGroups.length > 0 && filteredMembers.length > 0 && <CommandSeparator />}
                {filteredMembers.length > 0 && (
                  <CommandGroup heading="Members">
                    {filteredMembers.map((m) => {
                      const isSelected = selectedMemberIds.has(m.ownerid);
                      return (
                        <CommandItem
                          key={`m-${m.ownerid}`}
                          value={`m-${m.ownerid}-${m.ownername}`}
                          onSelect={() => onToggleMember(m.ownerid)}
                          className="flex items-center gap-2"
                        >
                          <Check
                            className={cn("h-4 w-4 shrink-0", isSelected ? "text-prfc-brown" : "text-transparent")}
                          />
                          <span className="flex-1">{m.ownername}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          )}
        </div>
      )}
    </div>
  );
}
