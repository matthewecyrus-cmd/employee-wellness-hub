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
 * Escapes special characters in iCalendar text values per RFC 5545.
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
 * Continuation lines start with a single space.
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
 * Builds a complete, RFC 5545-compliant iCalendar (.ics) string.
 * Works with Apple Calendar, Samsung Calendar, Google Calendar, Outlook, etc.
 */
function buildIcsContent(params: {
  sessionId: number;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}): string {
  const dtStamp = toIcsDate(new Date());
  const dtStart = toIcsDate(params.start);
  const dtEnd = toIcsDate(params.end);
  const uid = `tableside-session-${params.sessionId}@employee-wellness-hub`;
  const summary = escapeIcs(params.title);
  const location = params.location ? escapeIcs(params.location) : "";
  const description = params.description ? escapeIcs(params.description) : "";

  const lines: string[] = [
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

  // RFC 5545 requires CRLF line endings
  return lines.join("\r\n") + "\r\n";
}

export function registerCalendarRoute(app: Express): void {
  async function sendTablesideCalendar(req: Request, res: Response, useFilename: boolean): Promise<void> {
    const sessionId = parseInt(req.params.id ?? req.params.sessionId, 10);

    if (isNaN(sessionId)) {
      res.status(400).send("Invalid session ID");
      return;
    }

    const session = await getTablesideSessionById(sessionId);

    if (!session) {
      res.status(404).send("Session not found");
      return;
    }

    const start = new Date(session.startTime);
    const end = new Date(session.endTime);

    const icsContent = buildIcsContent({
      sessionId: session.id,
      title: session.title,
      start,
      end,
      location: session.location || undefined,
      description: session.description || undefined,
    });

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    if (useFilename) {
      res.setHeader("Content-Disposition", `inline; filename="tableside-session-${session.id}.ics"`);
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(icsContent);
  }

  /**
   * GET /api/tableside/:id.ics
   *
   * Registered FIRST so Express matches the literal ".ics" suffix before
   * the generic :id wildcard. Returns Content-Disposition: inline so iOS
   * Safari shows the native "Add to Calendar" sheet.
   */
  app.get("/api/tableside/:id.ics", async (req: Request, res: Response) => {
    await sendTablesideCalendar(req, res, true);
  });

  /**
   * GET /api/tableside/:id
   *
   * Primary mobile endpoint. No Content-Disposition so mobile browsers
   * are less likely to treat the response as a downloaded file.
   */
  app.get("/api/tableside/:id", async (req: Request, res: Response) => {
    await sendTablesideCalendar(req, res, false);
  });

  /**
   * GET /api/calendar/:sessionId
   *
   * Backward-compatible alias for older links. Keep this inline so stale
   * /api/calendar/:id links do not force the browser download flow.
   */
  app.get("/api/calendar/:sessionId", async (req: Request, res: Response) => {
    await sendTablesideCalendar(req, res, false);
  });
}
