"use client";
import { EntityCard } from "@/components/groups/entity-card";

export default function LinPage() {
  return (
    <div className="p-20 flex flex-col items-center gap-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Entity Card Preview</h1>

      <EntityCard name="Garden Club" memberCount={5} />
      <EntityCard name="Volunteer Team" memberCount={1} />
      <EntityCard name="Community Outreach" memberCount={12} />
      <EntityCard variant="add" />
    </div>
  );
}
