import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { getEventsForWeek } from "@/services/event";
import { getAllGroupsWithMemberIds, getGroupsWithMemberIdsByOwner } from "@/services/contact-group";
import { getAllMembers } from "@/lib/api/member-api";
import { coopStartOfWeek } from "@/utils/time";
import { EventsContent } from "./events-content";

export const metadata: Metadata = {
  title: "Events | PRFC Outreach",
};

export default async function EventsPage() {
  const session = await verifySession();
  const now = new Date();
  const weekStart = coopStartOfWeek(now);
  const groupsFn = session.isAdmin ? getAllGroupsWithMemberIds() : getGroupsWithMemberIdsByOwner(session.ownerid);
  const [initialWeekEvents, groups, members] = await Promise.all([
    getEventsForWeek(weekStart),
    groupsFn,
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
