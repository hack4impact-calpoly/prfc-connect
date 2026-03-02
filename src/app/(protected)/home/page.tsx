import { getSessionWithName } from "@/lib/dal";
import { getAllGroups, getGroupsByOwner } from "@/services/contact-group";
import { EntityCard } from "@/components/groups/entity-card";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default async function HomePage() {
  const session = await getSessionWithName();
  const groups = session.isAdmin ? await getAllGroups() : await getGroupsByOwner(session.ownerid);

  const greeting = getGreeting();
  const sectionHeading = session.isAdmin ? "All Groups" : "My Groups";

  return (
    <div>
      <h1 className="font-angkor text-3xl text-prfc-red mb-2">
        {greeting}, {session.ownername}!
      </h1>
      <h2 className="font-khula font-bold text-xl mb-6">{sectionHeading}</h2>

      {groups.length === 0 ? (
        <p className="text-muted-foreground">No groups yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <EntityCard
              key={group.id}
              variant="group"
              name={group.name}
              memberCount={group.memberCount}
              description={group.description}
            />
          ))}
        </div>
      )}
    </div>
  );
}
