import { splitName } from "@/utils/name";

describe("splitName", () => {
  it("splits two-word name into first and last", () => {
    expect(splitName("Kermit Komm")).toEqual({ firstName: "Kermit", lastName: "Komm" });
  });

  it("returns full string as firstName when no space", () => {
    expect(splitName("Kermit")).toEqual({ firstName: "Kermit", lastName: "" });
  });

  it("puts everything after first space into lastName", () => {
    expect(splitName("Mary Jane Watson")).toEqual({ firstName: "Mary", lastName: "Jane Watson" });
  });

  it("handles empty string", () => {
    expect(splitName("")).toEqual({ firstName: "", lastName: "" });
  });

  it("trims leading and trailing whitespace", () => {
    expect(splitName("  Kermit Komm  ")).toEqual({ firstName: "Kermit", lastName: "Komm" });
  });
});
