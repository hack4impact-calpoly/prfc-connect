"use client";

import { useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getAvatarColor, getInitials } from "@/utils/avatar";
import { MAX_PHOTO_BYTES, ALLOWED_PHOTO_TYPES } from "@/lib/photo-constraints";

type Props = {
  name: string;
  photoUrl: string | null;
  onUpload: (file: File) => void;
  isUploading?: boolean;
};

export function ProfilePhotoUpload({ name, photoUrl, onUpload, isUploading = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
      toast.error("Profile photo must be JPG or PNG");
      e.target.value = "";
      return;
    }
    if (file.size === 0) {
      toast.error("Profile photo file is empty");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Profile photo must be 2MB or smaller");
      e.target.value = "";
      return;
    }
    onUpload(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-4 rounded-full border border-prfc-border/30 bg-white p-3 pr-4">
      <Avatar className="h-16 w-16">
        {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
        <AvatarFallback
          style={{ backgroundColor: getAvatarColor(name), color: "#ffffff" }}
          className="text-lg font-semibold"
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">Profile Photo</p>
        <p className="text-sm text-muted-foreground">JPG or PNG. Max size of 2MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload profile photo"
      />
      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </>
        )}
      </Button>
    </div>
  );
}
