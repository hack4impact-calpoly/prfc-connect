"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MonthCalendar } from "@/components/events/month-calendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CreateEventPopover } from "@/components/events/create-event-popover";
import type { GroupOption, MemberOption } from "@/components/events/invitee-combobox";
import { TotalMembersCard } from "@/components/dashboard/total-members-card";
import { EventsThisMonthCard } from "@/components/dashboard/events-this-month-card";
import { ProfilePhotoUpload } from "@/components/profile/profile-photo-upload";

const PREVIEW_EVENT_DATES = new Set(["2026-04-13", "2026-04-15", "2026-04-16", "2026-04-17"]);

const MOCK_GROUPS: GroupOption[] = [
  { id: 1, name: "Board of Directors", memberCount: 7 },
  { id: 2, name: "General Members", memberCount: 142 },
  { id: 3, name: "Volunteers", memberCount: 23 },
  { id: 4, name: "Garden Committee", memberCount: 12 },
];

const MOCK_MEMBERS: MemberOption[] = [
  { ownerid: 100001, ownername: "Kevin Rutledge" },
  { ownerid: 100002, ownername: "Mary Jones" },
  { ownerid: 100003, ownername: "Tom Wilson" },
  { ownerid: 100004, ownername: "Sarah Chen" },
  { ownerid: 100005, ownername: "Derek Phan" },
  { ownerid: 100006, ownername: "Amy Lin" },
  { ownerid: 100007, ownername: "Jordan Ma" },
  { ownerid: 100008, ownername: "Priya Kakani" },
];

export function RutledgeContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date("2026-04-01"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date>();
  const [uploadingA, setUploadingA] = useState(false);
  const [uploadingB, setUploadingB] = useState(false);

  const handleDayClick = (date: Date) => {
    const withDefaultTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0);
    setDefaultDate(withDefaultTime);
    setDialogOpen(true);
  };

  const handlePreviewUpload = (setter: (v: boolean) => void) => (file: File) => {
    setter(true);
    toast.info(`Upload fired: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    setTimeout(() => setter(false), 800);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Profile Photo Upload Preview</h2>
          <div className="mt-4 space-y-3">
            <ProfilePhotoUpload
              name="Kevin Rutledge"
              photoUrl="/assets/produce.jpg"
              onUpload={handlePreviewUpload(setUploadingA)}
              isUploading={uploadingA}
            />
            <ProfilePhotoUpload
              name="Tom Wilson"
              photoUrl={null}
              onUpload={handlePreviewUpload(setUploadingB)}
              isUploading={uploadingB}
            />
          </div>
        </div>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Dashboard Stat Cards Preview</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TotalMembersCard count={376} />
            <TotalMembersCard count={0} />
            <EventsThisMonthCard count={30} />
            <EventsThisMonthCard count={0} />
          </div>
        </div>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Month Calendar Preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Click any day to open the create event popover.
          </p>
          <div className="mt-4">
            <MonthCalendar
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              eventDates={PREVIEW_EVENT_DATES}
              onDayClick={handleDayClick}
            />
          </div>
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[820px] gap-0 p-0">
          <CreateEventPopover
            onClose={() => setDialogOpen(false)}
            defaultDate={defaultDate}
            groups={MOCK_GROUPS}
            members={MOCK_MEMBERS}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
