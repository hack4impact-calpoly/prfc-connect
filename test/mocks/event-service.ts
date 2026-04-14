import { vi } from "vitest";

export const mockCreateEvent = vi.fn();
export const mockUpdateEvent = vi.fn();
export const mockDeleteEvent = vi.fn();
export const mockGetEventById = vi.fn();
export const mockIsEventOwner = vi.fn();
export const mockRsvpToEvent = vi.fn();
export const mockGetEventRsvps = vi.fn();
export const mockGetUpcomingEvents = vi.fn();
export const mockGetEventsForMonth = vi.fn();
export const mockGetEventsForWeek = vi.fn();
export const mockGetEventInviteeMemberIds = vi.fn();
export const mockInviteGroup = vi.fn();
export const mockInviteMembers = vi.fn();
export const mockSetEventInvitees = vi.fn();

vi.mock("@/services/event", () => ({
  createEvent: mockCreateEvent,
  updateEvent: mockUpdateEvent,
  deleteEvent: mockDeleteEvent,
  getEventById: mockGetEventById,
  isEventOwner: mockIsEventOwner,
  rsvpToEvent: mockRsvpToEvent,
  getEventRsvps: mockGetEventRsvps,
  getUpcomingEvents: mockGetUpcomingEvents,
  getEventsForMonth: mockGetEventsForMonth,
  getEventsForWeek: mockGetEventsForWeek,
  getEventInviteeMemberIds: mockGetEventInviteeMemberIds,
  inviteGroup: mockInviteGroup,
  inviteMembers: mockInviteMembers,
  setEventInvitees: mockSetEventInvitees,
}));

beforeEach(() => {
  mockCreateEvent.mockReset();
  mockUpdateEvent.mockReset();
  mockDeleteEvent.mockReset();
  mockGetEventById.mockReset();
  mockIsEventOwner.mockReset();
  mockRsvpToEvent.mockReset();
  mockGetEventRsvps.mockReset();
  mockGetUpcomingEvents.mockReset();
  mockGetEventsForMonth.mockReset();
  mockGetEventsForWeek.mockReset();
  mockGetEventInviteeMemberIds.mockReset();
  mockInviteGroup.mockReset();
  mockInviteMembers.mockReset();
  mockSetEventInvitees.mockReset();
});
