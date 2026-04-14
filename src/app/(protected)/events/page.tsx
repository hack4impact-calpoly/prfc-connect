import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { getEventsForWeek } from "@/services/event";
import { getAllGroupsWithMemberIds } from "@/services/contact-group";
import { getAllMembers } from "@/lib/api/member-api";
import { coopStartOfWeek } from "@/lib/time";
import { EventsContent } from "./events-content";

export const metadata: Metadata = {
  title: "Events | PRFC Connect",
};

export default async function EventsPage() {
  const session = await verifySession();
  const now = new Date();
  const weekStart = coopStartOfWeek(now);
  const [initialWeekEvents, groups, members] = await Promise.all([
    getEventsForWeek(weekStart),
    getAllGroupsWithMemberIds(),
    getAllMembers(),
  ]);

  return (
    <EventsContent
      initialDateIso={now.toISOString()}
      initialWeekEvents={initialWeekEvents}
      groups={groups}
      members={members}
      currentUserOwnerid={session.ownerid}
      isAdmin={session.isAdmin}
    />
  );
}
