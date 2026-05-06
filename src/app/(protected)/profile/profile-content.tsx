"use client";

import { handleActionError } from "@/utils/auth-redirect";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfilePhotoUpload } from "@/components/profile/profile-photo-upload";
import { PersonalInformationCard } from "@/components/profile/personal-information-card";
import { uploadPhotoAction, deletePhotoAction } from "@/actions/settings";
import type { MemberProfile } from "@/services/profile";

type Props = {
  profile: MemberProfile;
  photoUrl: string | null;
  userName: string;
  isAdmin: boolean;
};

export function ProfileContent({ profile, photoUrl, userName, isAdmin }: Props) {
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(photoUrl);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setCurrentPhotoUrl(photoUrl);
  }, [photoUrl]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadPhotoAction(formData);
    setIsUploading(false);
    if (result.success && result.data) {
      setCurrentPhotoUrl(result.data.url);
      toast.success("Photo updated");
    } else {
      toast.error(handleActionError(result.error, "Failed to upload photo"));
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-angkor text-3xl text-prfc-brown">My Profile</h1>
      <p className="mt-1 text-muted-foreground">{isAdmin ? "Admin" : "Member"}</p>

      <div className="mt-6">
        <ProfilePhotoUpload
          name={userName}
          photoUrl={currentPhotoUrl}
          onUpload={handleUpload}
          onDelete={async () => {
            setIsUploading(true);
            const result = await deletePhotoAction();
            setIsUploading(false);
            if (result.success) {
              setCurrentPhotoUrl(null);
              toast.success("Photo removed");
            } else {
              toast.error(handleActionError(result.error, "Failed to remove photo"));
            }
          }}
          isUploading={isUploading}
        />
      </div>

      <div className="mt-8">
        <PersonalInformationCard
          firstName={profile.firstName}
          lastName={profile.lastName}
          email={profile.email}
          phone={profile.phone}
        />
      </div>
    </div>
  );
}
