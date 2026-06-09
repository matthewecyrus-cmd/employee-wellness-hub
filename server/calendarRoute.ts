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

function isAndroidRequest(req: Request): boolean {
  return /android/i.test(req.get("user-agent") || "");
}

function androidIntentValue(value: string): string {
  return encodeURIComponent(value).replace(/'/g, "%27");
}

function buildAndroidCalendarIntentUrl(params: {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  targetPackage?: "com.google.android.calendar";
}): string {
  return [
    "intent://com.android.calendar/events#Intent",
    "scheme=content",
    "action=android.intent.action.INSERT",
    ...(params.targetPackage ? [`package=${params.targetPackage}`] : []),
    "type=vnd.android.cursor.item/event",
    `S.title=${androidIntentValue(params.title)}`,
    ...(params.location ? [`S.eventLocation=${androidIntentValue(params.location)}`] : []),
    ...(params.description ? [`S.description=${androidIntentValue(params.description)}`] : []),
    `l.beginTime=${params.start.getTime()}`,
    `l.endTime=${params.end.getTime()}`,
    "end",
  ].join(";");
}

function redirectAndroidToNativeCalendar(
  res: Response,
  params: {
    title: string;
    start: Date;
    end: Date;
    location?: string;
    description?: string;
    targetPackage?: "com.google.android.calendar";
  },
): void {
  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, buildAndroidCalendarIntentUrl(params));
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

/**
 * Builds a complete, RFC 5545-compliant iCalendar (.ics) string.
 * Works with Apple Calendar, Outlook, and desktop calendar clients.
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

  return lines.join("\r\n") + "\r\n";
}

async function getCalendarRouteSession(req: Request, res: Response, idParam: string) {
  const sessionId = parseInt(idParam, 10);

  if (isNaN(sessionId)) {
    res.status(400).send("Invalid session ID");
    return null;
  }

  const session = await getTablesideSessionById(sessionId);

  if (!session) {
    res.status(404).send("Session not found");
    return null;
  }

  return session;
}

export function registerCalendarRoute(app: Express): void {
  /**
   * GET /api/tableside/:id.ics
   *
   * Non-Android: returns a normal inline ICS for iPhone, Outlook, desktop, etc.
   * Android: never returns ICS. Android gets a native calendar insert intent.
   */
  app.get("/api/tableside/:id.ics", async (req: Request, res: Response) => {
    const session = await getCalendarRouteSession(req, res, req.params.id);
    if (!session) return;

    const start = new Date(session.startTime);
    const end = new Date(session.endTime);

    if (isAndroidRequest(req)) {
      redirectAndroidToNativeCalendar(res, {
        title: session.title,
        start,
        end,
        location: session.location || undefined,
        description: session.description || undefined,
      });
      return;
    }

    const icsContent = buildIcsContent({
      sessionId: session.id,
      title: session.title,
      start,
      end,
      location: session.location || undefined,
      description: session.description || undefined,
    });

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="tableside-session-${session.id}.ics"`);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(icsContent);
  });

  /**
   * GET /api/calendar/:sessionId
   *
   * Backward-compatible alias for older ICS links. Android is still blocked
   * from receiving a downloadable calendar file.
   */
  app.get("/api/calendar/:sessionId", async (req: Request, res: Response) => {
    const session = await getCalendarRouteSession(req, res, req.params.sessionId);
    if (!session) return;

    const start = new Date(session.startTime);
    const end = new Date(session.endTime);

    if (isAndroidRequest(req)) {
      redirectAndroidToNativeCalendar(res, {
        title: session.title,
        start,
        end,
        location: session.location || undefined,
        description: session.description || undefined,
      });
      return;
    }

    const icsContent = buildIcsContent({
      sessionId: session.id,
      title: session.title,
      start,
      end,
      location: session.location || undefined,
      description: session.description || undefined,
    });

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="tableside-session-${session.id}.ics"`);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(icsContent);
  });

  /**
   * GET /api/calendar/:sessionId/gcal
   *
   * Non-Android: opens Google Calendar web event editor.
   * Android: never opens Google Calendar web. Android gets the native Google
   * Calendar app intent instead.
   */
  app.get("/api/calendar/:sessionId/gcal", async (req: Request, res: Response) => {
    const session = await getCalendarRouteSession(req, res, req.params.sessionId);
    if (!session) return;

    const start = new Date(session.startTime);
    const end = new Date(session.endTime);

    if (isAndroidRequest(req)) {
      redirectAndroidToNativeCalendar(res, {
        title: session.title,
        start,
        end,
        location: session.location || undefined,
        description: session.description || undefined,
        targetPackage: "com.google.android.calendar",
      });
      return;
    }

    const p = new URLSearchParams({
      text: session.title,
      dates: `${toIcsDate(start)}/${toIcsDate(end)}`,
      ...(session.location ? { location: session.location } : {}),
      ...(session.description ? { details: session.description } : {}),
    });

    res.redirect(302, `https://calendar.google.com/calendar/r/eventedit?${p.toString()}`);
  });
}
