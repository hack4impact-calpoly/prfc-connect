import type { Metadata } from "next";
import { getSessionWithName } from "@/lib/dal";
import { getAllGroups } from "@/services/contact-group";
import { ComposeContent } from "./compose-content";

export const metadata: Metadata = {
  title: "Compose Message | PRFC Connect",
};

export default async function ComposeMessagePage() {
  const session = await getSessionWithName();
  const groups = await getAllGroups();

  return (
    <ComposeContent
      groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      currentUser={{ name: session.ownername }}
      isAdmin={session.isAdmin}
    />
  );
}
