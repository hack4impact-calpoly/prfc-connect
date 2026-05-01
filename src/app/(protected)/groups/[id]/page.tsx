import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getGroupById, enrichGroupMembers, isGroupOwner } from "@/services/contact-group";
import { getAllMembers, getMemberById } from "@/lib/api/member-api";
import { AppError } from "@/utils/errors";
import { GroupDetailContent } from "./group-detail-content";

async function loadGroup(groupId: number) {
  try {
    const group = await getGroupById(groupId);
    return await enrichGroupMembers(group);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const groupId = parseInt(id, 10);
  if (isNaN(groupId) || groupId <= 0) notFound();

  const session = await verifySession();
  if (!session.isAdmin && !(await isGroupOwner(groupId, session.ownerid))) redirect("/forbidden");

  const [enriched, allMembers] = await Promise.all([loadGroup(groupId), getAllMembers()]);
  const owner = await getMemberById(enriched.ownerid);

  return (
    <GroupDetailContent
      group={{
        id: enriched.id,
        name: enriched.name,
        description: enriched.description,
        ownerid: enriched.ownerid,
        ownerName: owner?.ownername ?? null,
        members: enriched.members.map((m) => ({
          memberId: m.memberId,
          ownername: m.ownername,
          owneremail: m.owneremail,
          notifyEmail: m.notifyEmail,
        })),
      }}
      allMembers={allMembers}
      currentUserOwnerid={session.ownerid}
      isAdmin={session.isAdmin}
    />
  );
}
