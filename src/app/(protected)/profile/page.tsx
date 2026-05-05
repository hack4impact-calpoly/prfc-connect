import type { Metadata } from "next";
import { getSessionWithName } from "@/lib/dal";
import { getMemberProfile } from "@/services/profile";
import { getProfilePhotoUrl } from "@/services/user-preference";
import { ProfileContent } from "./profile-content";

export const metadata: Metadata = {
  title: "Profile | PRFC Connect",
};

export default async function ProfilePage() {
  const session = await getSessionWithName();
  const [profile, photoUrl] = await Promise.all([
    getMemberProfile(session.ownerid, session.isAdmin),
    getProfilePhotoUrl(session.ownerid).catch(() => null),
  ]);

  return (
    <ProfileContent profile={profile} photoUrl={photoUrl} userName={session.ownername} isAdmin={session.isAdmin} />
  );
}
