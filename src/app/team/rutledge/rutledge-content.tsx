"use client";

import { GroupMemberTable } from "@/components/groups/group-member-table";

const MOCK_MEMBERS = [
  { memberId: 100001, ownername: "Angelica Allison", owneremail: "angelica.allison@email.com" },
  { memberId: 100002, ownername: "Aya Gallagher", owneremail: "aya.gallagher@email.com" },
  { memberId: 100003, ownername: "Brandon Schwartz", owneremail: "brandon.schwartz@email.com" },
  { memberId: 100004, ownername: "Sarah Chen", owneremail: "sarah.chen@email.com" },
  { memberId: 100005, ownername: "Derek Phan", owneremail: "derek.phan@email.com" },
];

export function RutledgeContent() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Group Member Table - View Mode</h2>
          <div className="mt-4">
            <GroupMemberTable members={MOCK_MEMBERS} mode="view" />
          </div>
        </div>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Group Member Table - Edit Mode</h2>
          <div className="mt-4">
            <GroupMemberTable members={MOCK_MEMBERS} mode="edit" onRemove={(id) => console.log("Remove:", id)} />
          </div>
        </div>
      </div>
    </div>
  );
}
