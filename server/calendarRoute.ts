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
 * Formats a Date to Google Calendar's format: YYYYMMDDTHHmmssZ
 * (same as ICS, Google accepts it)
 */
function toGCalDate(date: Date): string {
  return toIcsDate(date);
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

/**
 * Builds a Google Calendar event creation URL.
 * Works on Android Chrome and any browser where .ics won't auto-open.
 */
function buildGoogleCalendarUrl(params: {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}): string {
  const base = "https://calendar.google.com/calendar/r/eventedit";
  const p = new URLSearchParams({
    text: params.title,
    dates: `${toGCalDate(params.start)}/${toGCalDate(params.end)}`,
    ...(params.location ? { location: params.location } : {}),
    ...(params.description ? { details: params.description } : {}),
  });
  return `${base}?${p.toString()}`;
}

/**
 * Detects if the User-Agent is iOS Safari (which handles .ics natively).
 * Android Chrome and other browsers need the Google Calendar URL fallback.
 */
function isIOS(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function registerCalendarRoute(app: Express): void {
  /**
   * GET /api/calendar/:sessionId
   *
   * Strategy:
   * - iOS Safari: serve the .ics with Content-Type: text/calendar (NO attachment
   *   disposition). iOS intercepts it and shows the native "Add to Calendar" sheet.
   * - Android / other: redirect to Google Calendar event creation URL.
   *   This opens Google Calendar directly with the event pre-filled.
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

    const ua = req.headers["user-agent"] ?? "";
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);

    // ── Android / non-iOS: redirect to Google Calendar ──────────────────────
    if (!isIOS(ua)) {
      const gcalUrl = buildGoogleCalendarUrl({
        title: session.title,
        start,
        end,
        location: session.location || undefined,
        description: session.description || undefined,
      });
      res.redirect(302, gcalUrl);
      return;
    }

    // ── iOS: serve .ics inline so Safari opens the native calendar sheet ────
    const dtStamp = toIcsDate(new Date());
    const dtStart = toIcsDate(start);
    const dtEnd = toIcsDate(end);
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

    // NO "attachment" disposition — inline lets iOS Safari intercept and open
    // the native "Add to Calendar" sheet instead of downloading the file.
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="wellness-reminder-${session.id}.ics"`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(icsContent);
  });

  /**
   * GET /api/calendar/:sessionId/gcal
   *
   * Direct Google Calendar URL — used as explicit fallback link in the UI
   * for users who prefer Google Calendar regardless of device.
   */
  app.get("/api/calendar/:sessionId/gcal", async (req: Request, res: Response) => {
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

    const gcalUrl = buildGoogleCalendarUrl({
      title: session.title,
      start: new Date(session.startTime),
      end: new Date(session.endTime),
      location: session.location || undefined,
      description: session.description || undefined,
    });

    res.redirect(302, gcalUrl);
  });
}
