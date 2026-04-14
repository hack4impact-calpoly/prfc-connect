import type { EventWithRsvpCount } from "@/services/event";

export const eventTownHall: EventWithRsvpCount = {
  id: 1,
  createdAt: new Date("2026-04-01T00:00:00-07:00"),
  updatedAt: new Date("2026-04-01T00:00:00-07:00"),
  title: "Town Hall",
  description: null,
  location: null,
  startDate: new Date("2026-04-08T18:00:00-07:00"),
  endDate: new Date("2026-04-08T19:00:00-07:00"),
  isAllDay: false,
  rsvpDeadline: null,
  eventType: "meeting",
  ownerid: 100001,
  groupId: null,
  rsvpCount: 5,
};

export const eventMemberTownHall: EventWithRsvpCount = {
  id: 1,
  createdAt: new Date("2026-04-01T00:00:00-07:00"),
  updatedAt: new Date("2026-04-01T00:00:00-07:00"),
  title: "Member Town Hall",
  description: "Monthly meeting",
  location: "Downtown Paso Robles",
  startDate: new Date("2026-04-08T18:00:00-07:00"),
  endDate: new Date("2026-04-08T19:00:00-07:00"),
  isAllDay: false,
  rsvpDeadline: new Date("2026-04-07T18:00:00-07:00"),
  eventType: "meeting",
  ownerid: 100001,
  groupId: 1,
  rsvpCount: 0,
};

export const eventBoardMeeting: EventWithRsvpCount = {
  id: 42,
  createdAt: new Date("2026-04-01T00:00:00-07:00"),
  updatedAt: new Date("2026-04-01T00:00:00-07:00"),
  title: "Existing Board Meeting",
  description: "Quarterly review",
  location: "Co-op Office",
  startDate: new Date("2026-04-15T14:00:00-07:00"),
  endDate: new Date("2026-04-15T15:00:00-07:00"),
  isAllDay: false,
  rsvpDeadline: null,
  eventType: "meeting",
  ownerid: 100001,
  groupId: null,
  rsvpCount: 0,
};
