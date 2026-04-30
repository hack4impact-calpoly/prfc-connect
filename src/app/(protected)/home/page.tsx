import { verifySession } from "@/lib/dal";
import { getAllMembers } from "@/lib/api/member-api";
import { getEventsForMonth, getUpcomingEvents } from "@/services/event";
import { getRecentActivity } from "@/services/dashboard";
import { getAllMessageHistory } from "@/services/message";
import { coopNow } from "@/utils/time";
import { HomeContent } from "./home-content";

export default async function HomePage() {
  const session = await verifySession();
  const now = coopNow();

  const [memberList, monthEvents, upcomingEvents, recentActivity, recentMessages] = await Promise.all([
    getAllMembers(),
    getEventsForMonth(now.year, now.month0 + 1),
    getUpcomingEvents(4),
    getRecentActivity(session.ownerid, 3),
    getAllMessageHistory({ limit: 3 }),
  ]);

  return (
    <HomeContent
      totalMembers={memberList.length}
      eventsThisMonth={monthEvents.length}
      upcomingEvents={upcomingEvents}
      recentActivity={recentActivity}
      recentMessages={recentMessages}
    />
  );
}
