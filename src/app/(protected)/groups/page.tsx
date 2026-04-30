import { getSessionWithName } from "@/lib/dal";
import { getAllGroups, getGroupsByOwner } from "@/services/contact-group";
import { getAllMembers } from "@/lib/api/member-api";
import { GroupsContent } from "./groups-content";

export default async function GroupsPage() {
  const session = await getSessionWithName();
  const isAdmin = session.isAdmin;

  const [myGroups, allGroups, members] = await Promise.all([
    getGroupsByOwner(session.ownerid),
    isAdmin ? getAllGroups() : Promise.resolve([]),
    getAllMembers(),
  ]);

  return (
    <GroupsContent
      myGroups={myGroups}
      allGroups={allGroups}
      isAdmin={isAdmin}
      ownerId={session.ownerid}
      members={members}
    />
  );
}
