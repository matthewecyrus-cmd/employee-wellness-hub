import type { Express, Request, Response } from "express";
import { getTablesideSessionById } from "./db";

/**
 * Formats a Date to iCalendar DTSTART/DTEND format in UTC.
 * Format: YYYYMMDDTHHmmssZ
 */
function toIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Escapes special characters in iCalendar text values.
 */
function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Folds long iCalendar lines at 75 octets per RFC 5545.
 */
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

/**
 * Generates a unique UID for the event based on session id and domain.
 */
function generateUid(sessionId: number): string {
  return `tableside-session-${sessionId}@employee-wellness-hub`;
}

export function registerCalendarRoute(app: Express): void {
  /**
   * GET /api/calendar/:sessionId
   *
   * Returns an .ics file with Content-Type: text/calendar so that:
   * - iOS automatically surfaces the native Apple Calendar "Add" sheet
   * - Android shows the Google Calendar save preview
   *
   * No extra steps required for the employee — the OS handles it.
   */
  app.get("/api/calendar/:sessionId", async (req: Request, res: Response) => {
    const sessionId = parseInt(req.params.sessionId, 10);

    if (isNaN(sessionId)) {
      res.status(400).send("Invalid session ID");
      return;
    }

    const session = await getTablesideSessionById(sessionId);

    if (!session) {
      res.status(404).send("Session not found");
      return;
    }

    const now = new Date();
    const dtStamp = toIcsDate(now);
    const dtStart = toIcsDate(new Date(session.startTime));
    const dtEnd = toIcsDate(new Date(session.endTime));
    const uid = generateUid(session.id);
    const summary = escapeIcs(session.title);
    const location = escapeIcs(session.location || "");
    const description = escapeIcs(session.description || "");

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Employee Wellness Hub//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      foldLine(`UID:${uid}`),
      foldLine(`DTSTAMP:${dtStamp}`),
      foldLine(`DTSTART:${dtStart}`),
      foldLine(`DTEND:${dtEnd}`),
      foldLine(`SUMMARY:${summary}`),
      ...(location ? [foldLine(`LOCATION:${location}`)] : []),
      ...(description ? [foldLine(`DESCRIPTION:${description}`)] : []),
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
      "END:VCALENDAR",
    ];

    const icsContent = lines.join("\r\n");

    // The critical header: text/calendar tells iOS/Android to hand the file
    // directly to the calendar app instead of downloading it as a generic file.
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="wellness-reminder-${session.id}.ics"`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(icsContent);
  });
}
