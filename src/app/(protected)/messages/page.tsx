import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { getMessageHistoryPage } from "@/services/message";
import { env } from "@/env";
import { MessagesContent } from "./messages-content";

export const metadata: Metadata = {
  title: "Messages | PRFC Connect",
};

export default async function MessagesPage() {
  const session = await verifySession();
  const initialPage = await getMessageHistoryPage(session.isAdmin ? {} : { recipientId: session.ownerid });

  return <MessagesContent initialPage={initialPage} isAdmin={session.isAdmin} smsFeatureEnabled={env.SMS_ENABLED} />;
}
