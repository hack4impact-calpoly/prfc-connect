import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { getAllMessageHistory } from "@/services/message";
import { MessagesContent } from "./messages-content";

export const metadata: Metadata = {
  title: "Messages | PRFC Connect",
};

export default async function MessagesPage() {
  const session = await verifySession();
  const senderId = session.isAdmin ? undefined : session.ownerid;
  const messages = await getAllMessageHistory({ senderId });

  return <MessagesContent initialMessages={messages} isAdmin={session.isAdmin} />;
}
