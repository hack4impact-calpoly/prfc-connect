import type { Metadata } from "next";
import { getSessionWithName } from "@/lib/dal";
import { getAllGroups, getGroupsByOwner } from "@/services/contact-group";
import { getDailyEmailCount } from "@/services/email";
import { env } from "@/env";
import { ComposeContent } from "./compose-content";

export const metadata: Metadata = {
  title: "Compose Message | PRFC Connect",
};

export default async function ComposeMessagePage() {
  const session = await getSessionWithName();
  const groupsFn = session.isAdmin ? getAllGroups() : getGroupsByOwner(session.ownerid);
  const [groups, dailySentCount] = await Promise.all([groupsFn, getDailyEmailCount()]);
  const dailyEmailsRemaining = Math.max(0, env.DAILY_EMAIL_LIMIT - dailySentCount);

  return (
    <ComposeContent
      groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      currentUser={{ name: session.ownername }}
      isAdmin={session.isAdmin}
      smsFeatureEnabled={env.SMS_ENABLED}
      dailyEmailsRemaining={dailyEmailsRemaining}
    />
  );
}
