import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CalendarPlus, Clock, MapPin } from "lucide-react";
import { Link } from "wouter";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTimeRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

/**
 * Formats a Date to Google Calendar's required format: YYYYMMDDTHHmmss (NO Z suffix).
 * Google Calendar interprets the times as local, so we use local time components.
 */
function toGCalDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/** Formats a Date to iCalendar UTC format: YYYYMMDDTHHmmssZ */
function toIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:.]/g, "").replace(/\d{3}Z$/, "Z");
}

/** Escapes special characters in iCalendar text values per RFC 5545 */
function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Folds long lines at 75 octets per RFC 5545 */
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

/** Builds a Google Calendar "add event" URL with local-time dates (no Z suffix). */
function buildGCalUrl(params: {
  title: string;
  start: Date;
  end: Date;
  location?: string | null;
}): string {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", params.title);
  url.searchParams.set("dates", `${toGCalDate(params.start)}/${toGCalDate(params.end)}`);
  if (params.location) url.searchParams.set("location", params.location);
  return url.toString();
}

/** Generates a valid RFC 5545 .ics Blob in the browser (no server). */
function buildIcsBlob(params: {
  sessionId: number;
  title: string;
  start: Date;
  end: Date;
  location?: string | null;
  description?: string | null;
}): Blob {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Employee Wellness Hub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    foldLine(`UID:tableside-session-${params.sessionId}@employee-wellness-hub`),
    foldLine(`DTSTAMP:${toIcsDate(new Date())}`),
    foldLine(`DTSTART:${toIcsDate(params.start)}`),
    foldLine(`DTEND:${toIcsDate(params.end)}`),
    foldLine(`SUMMARY:${escapeIcs(params.title)}`),
    ...(params.location ? [foldLine(`LOCATION:${escapeIcs(params.location)}`)] : []),
    ...(params.description ? [foldLine(`DESCRIPTION:${escapeIcs(params.description)}`)] : []),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const icsContent = lines.join("\r\n") + "\r\n";
  return new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
}

/** Opens the .ics via a data URI — the browser hands text/calendar to the OS calendar app. */
function openIcsDataUri(icsString: string): void {
  const dataUri = 'data:text/calendar;charset=utf8,' + encodeURIComponent(icsString);
  window.location.href = dataUri;
}

// Accent colors for each session card (cycles through 4)
const SESSION_ACCENTS = [
  { gradient: "linear-gradient(90deg, #7C3AED, #9F67FF)", glow: "rgba(124,58,237,0.45)" },
  { gradient: "linear-gradient(90deg, #0EA5E9, #38BDF8)", glow: "rgba(14,165,233,0.45)" },
  { gradient: "linear-gradient(90deg, #10B981, #34D399)", glow: "rgba(16,185,129,0.45)" },
  { gradient: "linear-gradient(90deg, #F59E0B, #FCD34D)", glow: "rgba(245,158,11,0.45)" },
];

export default function Tableside() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: sessions = [], isLoading } = trpc.tableside.list.useQuery({ month, year });

  // Track which session card has its calendar options expanded (null = none)
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden px-4 pb-6 pt-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)" }}
        />

        <div className="relative">
          <Link href="/">
            <button className="mb-4 flex items-center gap-2 rounded-lg bg-slate-700/60 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-150 active:scale-95">
              <ArrowLeft className="h-4 w-4" />
              Back to Hub
            </button>
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #7C3AED, #9F67FF)" }}
            >
              <CalendarPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1
                className="font-display text-2xl font-black text-white"
                style={{ fontFamily: "Poppins, Inter, sans-serif" }}
              >
                Tableside Activity
              </h1>
              <p className="text-sm text-slate-400">
                {MONTH_NAMES[month]} {year}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Instruction Banner ────────────────────────────────────────────── */}
      <div className="mx-4 mb-5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3">
        <p className="text-sm leading-relaxed text-purple-200">
          <span className="font-semibold">Pick a session that works for you</span> and tap
          "Add to My Calendar" — your phone will open the calendar save screen instantly.
        </p>
      </div>

      {/* ── Session Cards ─────────────────────────────────────────────────── */}
      <main className="space-y-4 px-4 pb-10">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-700/50" />
          ))}

        {!isLoading && sessions.length === 0 && (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 px-6 py-10 text-center">
            <CalendarPlus className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <p className="font-semibold text-slate-400">No sessions scheduled yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Check back soon — sessions for this month will appear here.
            </p>
          </div>
        )}

        {sessions.map((session, i) => {
          const start = new Date(session.startTime);
          const end = new Date(session.endTime);
          const accent = SESSION_ACCENTS[i % SESSION_ACCENTS.length];
          const isExpanded = expandedId === session.id;

          return (
            <div
              key={session.id}
              className="overflow-hidden rounded-2xl bg-white shadow-lg"
            >
              {/* Color accent bar */}
              <div className="h-1.5 w-full" style={{ background: accent.gradient }} />

              <div className="p-4">
                {/* Session number badge */}
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: accent.gradient }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Option {i + 1}
                  </span>
                </div>

                <h2
                  className="font-display text-base font-bold leading-snug text-slate-900"
                  style={{ fontFamily: "Poppins, Inter, sans-serif" }}
                >
                  {session.title}
                </h2>

                <div className="mt-3 space-y-2">
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                    <div>
                      <div className="font-semibold">{formatDay(start)}</div>
                      <div className="text-slate-500">{formatTimeRange(start, end)}</div>
                    </div>
                  </div>

                  {session.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <MapPin className="h-4 w-4 shrink-0 text-purple-600" />
                      <span className="font-medium">{session.location}</span>
                    </div>
                  )}
                </div>

                {/* ── Calendar CTA ──────────────────────────────────────── */}
                {!isExpanded ? (
                  <button
                    onClick={() => setExpandedId(session.id)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-150 active:scale-95"
                    style={{
                      background: accent.gradient,
                      boxShadow: `0 4px 14px -2px ${accent.glow}`,
                    }}
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Add to My Calendar
                  </button>
                ) : (
                  <div className="mt-4 space-y-2">
                    {/* Google Calendar */}
                    <a
                      href={buildGCalUrl({ title: session.title, start, end, location: session.location })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-150 active:scale-95"
                      style={{
                        background: accent.gradient,
                        boxShadow: `0 4px 14px -2px ${accent.glow}`,
                      }}
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Google Calendar
                    </a>

                    {/* Apple / Outlook — .ics download */}
                    <button
                        onClick={() => {
                          const lines = [
                            "BEGIN:VCALENDAR",
                            "VERSION:2.0",
                            "PRODID:-//Employee Wellness Hub//EN",
                            "CALSCALE:GREGORIAN",
                            "METHOD:PUBLISH",
                            "BEGIN:VEVENT",
                            `UID:tableside-session-${session.id}@employee-wellness-hub`,
                            `DTSTAMP:${toIcsDate(new Date())}`,
                            `DTSTART:${toIcsDate(start)}`,
                            `DTEND:${toIcsDate(end)}`,
                            `SUMMARY:${escapeIcs(session.title)}`,
                            ...(session.location ? [`LOCATION:${escapeIcs(session.location)}`] : []),
                            ...(session.description ? [`DESCRIPTION:${escapeIcs(session.description)}`] : []),
                            "STATUS:CONFIRMED",
                            "END:VEVENT",
                            "END:VCALENDAR",
                          ];
                          openIcsDataUri(lines.join("\r\n") + "\r\n");
                          setExpandedId(null);
                        }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-150 active:scale-95 hover:bg-slate-100"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Apple / Outlook Calendar
                    </button>

                    {/* Cancel */}
                    <button
                      onClick={() => setExpandedId(null)}
                      className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!isLoading && sessions.length > 0 && (
          <p className="pt-2 text-center text-xs text-slate-500">
            Each button saves only that session to your calendar.
          </p>
        )}
      </main>
    </div>
  );
}
