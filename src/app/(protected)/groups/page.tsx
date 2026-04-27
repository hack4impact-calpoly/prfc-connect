import { getSessionWithName } from "@/lib/dal";
import { getAllGroups, getGroupsByOwner } from "@/services/contact-group";
import { getAllMembers } from "@/lib/api/member-api";
import { GroupsContent } from "./groups-content";

export default async function GroupsPage() {
  const session = await getSessionWithName();
  const isAdmin = session.isAdmin;

  const [groups, members] = await Promise.all([
    isAdmin ? getAllGroups() : getGroupsByOwner(session.ownerid),
    getAllMembers(),
  ]);

  return <GroupsContent groups={groups} isAdmin={isAdmin} ownerId={session.ownerid} members={members} />;
}
