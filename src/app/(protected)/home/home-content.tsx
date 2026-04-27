"use client";

import { EntityCard } from "@/components/groups/entity-card";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import type { GroupWithCount } from "@/services/contact-group";

interface HomeContentProps {
  groups: GroupWithCount[];
  greeting: string;
  sectionHeading: string;
}

export function HomeContent({ groups, greeting, sectionHeading }: HomeContentProps) {
  const filteredGroups = useFuzzySearch(groups, {
    keys: ["name", "description"],
  });

  return (
    <div>
      <h1 className="font-angkor text-3xl text-prfc-red mb-2">{greeting}</h1>
      <h2 className="font-khula font-bold text-xl mb-6">{sectionHeading}</h2>

      {filteredGroups.length === 0 ? (
        <p className="text-muted-foreground">
          {groups.length === 0 ? "No groups yet." : "No groups match your search."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredGroups.map((group) => (
            <EntityCard key={group.id} variant="group" name={group.name} memberCount={group.memberCount} />
          ))}
        </div>
      )}
    </div>
  );
}
