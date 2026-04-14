import { getSessionWithName } from "@/lib/dal";
import { getAllGroups, getGroupsByOwner } from "@/services/contact-group";
import { coopHourOfDay } from "@/lib/time";
import { HomeContent } from "./home-content";

function getGreeting(): string {
  const hour = coopHourOfDay(new Date());
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
    <HomeContent groups={groups} greeting={`${greeting}, ${session.ownername}!`} sectionHeading={sectionHeading} />
  );
}
