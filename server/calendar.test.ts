import { describe, expect, it, vi, beforeEach } from "vitest";

// ─── ICS generation logic (extracted for unit testing) ────────────────────────

function toIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  const MAX = 75;
  if (line.length <= MAX) return line;
  let result = "";
  let pos = 0;
  while (pos < line.length) {
    if (pos === 0) {
      result += line.slice(0, MAX);
      pos = MAX;
    } else {
      result += "\r\n " + line.slice(pos, pos + MAX - 1);
      pos += MAX - 1;
    }
  }
  return result;
}

function buildIcs(session: {
  id: number;
  title: string;
  location: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
}): string {
  const now = new Date("2026-06-01T00:00:00Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Employee Wellness Hub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    foldLine(`UID:tableside-session-${session.id}@employee-wellness-hub`),
    foldLine(`DTSTAMP:${toIcsDate(now)}`),
    foldLine(`DTSTART:${toIcsDate(session.startTime)}`),
    foldLine(`DTEND:${toIcsDate(session.endTime)}`),
    foldLine(`SUMMARY:${escapeIcs(session.title)}`),
    ...(session.location ? [foldLine(`LOCATION:${escapeIcs(session.location)}`)] : []),
    ...(session.description ? [foldLine(`DESCRIPTION:${escapeIcs(session.description)}`)] : []),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ICS generation", () => {
  it("produces a valid VCALENDAR structure", () => {
    const ics = buildIcs({
      id: 1,
      title: "Tension Relief",
      location: "Bldg. 7 Breakroom",
      description: "Learn targeted pressure techniques.",
      startTime: new Date("2026-06-16T10:30:00Z"),
      endTime: new Date("2026-06-16T11:30:00Z"),
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("METHOD:PUBLISH");
  });

  it("includes the correct DTSTART and DTEND", () => {
    const ics = buildIcs({
      id: 2,
      title: "Test Event",
      location: "",
      description: null,
      startTime: new Date("2026-06-16T10:30:00Z"),
      endTime: new Date("2026-06-16T11:30:00Z"),
    });

    expect(ics).toContain("DTSTART:20260616T103000Z");
    expect(ics).toContain("DTEND:20260616T113000Z");
  });

  it("includes SUMMARY with the session title", () => {
    const ics = buildIcs({
      id: 3,
      title: "Wellness Check",
      location: "",
      description: null,
      startTime: new Date("2026-06-16T10:30:00Z"),
      endTime: new Date("2026-06-16T11:30:00Z"),
    });

    expect(ics).toContain("SUMMARY:Wellness Check");
  });

  it("escapes special characters in title and description", () => {
    const ics = buildIcs({
      id: 4,
      title: "Health; Wellness, Check",
      location: "",
      description: "Line1\nLine2",
      startTime: new Date("2026-06-16T10:30:00Z"),
      endTime: new Date("2026-06-16T11:30:00Z"),
    });

    expect(ics).toContain("SUMMARY:Health\\; Wellness\\, Check");
    expect(ics).toContain("DESCRIPTION:Line1\\nLine2");
  });

  it("omits LOCATION when empty", () => {
    const ics = buildIcs({
      id: 5,
      title: "Test",
      location: "",
      description: null,
      startTime: new Date("2026-06-16T10:30:00Z"),
      endTime: new Date("2026-06-16T11:30:00Z"),
    });

    expect(ics).not.toContain("LOCATION:");
  });

  it("folds lines longer than 75 characters", () => {
    const longTitle = "A".repeat(100);
    const folded = foldLine(`SUMMARY:${longTitle}`);
    const lines = folded.split("\r\n");
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });

  it("uses CRLF line endings throughout", () => {
    const ics = buildIcs({
      id: 6,
      title: "CRLF Test",
      location: "Room A",
      description: null,
      startTime: new Date("2026-06-16T10:30:00Z"),
      endTime: new Date("2026-06-16T11:30:00Z"),
    });

    // Every line break should be \r\n per RFC 5545
    const lines = ics.split("\r\n");
    expect(lines.length).toBeGreaterThan(5);
    // No bare \n without preceding \r
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });
});

describe("toIcsDate", () => {
  it("formats UTC dates correctly", () => {
    const d = new Date("2026-06-16T10:30:00.000Z");
    expect(toIcsDate(d)).toBe("20260616T103000Z");
  });
});
