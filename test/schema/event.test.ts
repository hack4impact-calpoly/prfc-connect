import { CreateEventSchema, UpdateEventSchema, RsvpSchema } from "@/schema/event";

describe("CreateEventSchema", () => {
  it("accepts valid event data", () => {
    const result = CreateEventSchema.safeParse({
      title: "Town Hall",
      startDate: "2026-04-08T18:00:00Z",
      endDate: "2026-04-08T19:00:00Z",
      eventType: "meeting",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = CreateEventSchema.safeParse({
      title: "",
      startDate: "2026-04-08T18:00:00Z",
      endDate: "2026-04-08T19:00:00Z",
      eventType: "meeting",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid event type", () => {
    const result = CreateEventSchema.safeParse({
      title: "Test",
      startDate: "2026-04-08T18:00:00Z",
      endDate: "2026-04-08T19:00:00Z",
      eventType: "party",
    });

    expect(result.success).toBe(false);
  });

  it("accepts all valid event types", () => {
    for (const eventType of ["social", "networking", "volunteer", "meeting"]) {
      const result = CreateEventSchema.safeParse({
        title: "Test",
        startDate: "2026-04-08T18:00:00Z",
        endDate: "2026-04-08T19:00:00Z",
        eventType,
      });
      expect(result.success).toBe(true);
    }
  });

  it("coerces string dates to Date objects", () => {
    const result = CreateEventSchema.safeParse({
      title: "Test",
      startDate: "2026-04-08T18:00:00Z",
      endDate: "2026-04-08T19:00:00Z",
      eventType: "social",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
      expect(result.data.endDate).toBeInstanceOf(Date);
    }
  });

  it("rejects endDate before startDate", () => {
    const result = CreateEventSchema.safeParse({
      title: "Test",
      startDate: "2026-04-08T19:00:00Z",
      endDate: "2026-04-08T18:00:00Z",
      eventType: "meeting",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("endDate");
    }
  });

  it("accepts endDate equal to startDate", () => {
    const result = CreateEventSchema.safeParse({
      title: "Test",
      startDate: "2026-04-08T18:00:00Z",
      endDate: "2026-04-08T18:00:00Z",
      eventType: "meeting",
    });

    expect(result.success).toBe(true);
  });
});

describe("UpdateEventSchema", () => {
  it("rejects endDate before startDate when both provided", () => {
    const result = UpdateEventSchema.safeParse({
      startDate: "2026-04-08T19:00:00Z",
      endDate: "2026-04-08T18:00:00Z",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("endDate");
    }
  });

  it("accepts update with only startDate", () => {
    const result = UpdateEventSchema.safeParse({
      startDate: "2026-04-08T19:00:00Z",
    });

    expect(result.success).toBe(true);
  });

  it("accepts update with only endDate", () => {
    const result = UpdateEventSchema.safeParse({
      endDate: "2026-04-08T19:00:00Z",
    });

    expect(result.success).toBe(true);
  });
});

describe("RsvpSchema", () => {
  it("accepts valid RSVP", () => {
    const result = RsvpSchema.safeParse({ eventId: 1, status: "going" });

    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = RsvpSchema.safeParse({ eventId: 1, status: "interested" });

    expect(result.success).toBe(false);
  });

  it("accepts all valid statuses", () => {
    for (const status of ["going", "maybe", "declined"]) {
      const result = RsvpSchema.safeParse({ eventId: 1, status });
      expect(result.success).toBe(true);
    }
  });
});
