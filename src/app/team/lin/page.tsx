"use client";

import { EntityCard } from "@/components/groups/entity-card";

export default function LinPage() {
  return (
    <div className="p-20 flex flex-col items-center gap-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Entity Card Preview</h1>

      <EntityCard
        name="Garden Club"
        memberCount={5}
        description="A group for garden enthusiasts who love growing vegetables and sharing tips about sustainable farming practices."
        onClick={() => alert("Clicked Garden Club")}
      />

      <EntityCard
        name="Volunteer Team"
        memberCount={1}
        description={null}
        onClick={() => alert("Clicked Volunteer Team")}
      />

      <EntityCard
        name="Community Outreach"
        memberCount={12}
        description="Short description"
        onClick={() => alert("Clicked Community Outreach")}
      />

      <EntityCard variant="add" onClick={() => alert("Add new group")} />
    </div>
  );
}
