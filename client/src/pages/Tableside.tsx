import { trpc } from "@/lib/trpc";
import { ArrowLeft, CalendarPlus, Clock, MapPin } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type CalendarButtonParams = {
  sessionId: number;
  title: string;
  start: Date;
  end: Date;
  location?: string | null;
  description?: string | null;
};

type CalendarOption = "google" | "other";

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

function isAndroid(): boolean {
  return /android/i.test(window.navigator.userAgent);
}

function buildGoogleCalendarHref(sessionId: number): string {
  return `/api/calendar/${sessionId}/gcal`;
}

function buildIcsHref(sessionId: number): string {
  return `/api/tableside/${sessionId}.ics`;
}

function androidIntentValue(value: string): string {
  return encodeURIComponent(value).replace(/'/g, "%27");
}

/**
 * Native Android calendar insert intent.
 *
 * Do not add browser_fallback_url. Any browser fallback is what causes Chrome
 * to open Google Calendar in the browser. Do not point Android at .ics either;
 * Chrome treats .ics as a file download.
 */
function buildAndroidCalendarIntent(
  params: CalendarButtonParams,
  targetPackage?: "com.google.android.calendar",
): string {
  return [
    "intent://com.android.calendar/events#Intent",
    "scheme=content",
    "action=android.intent.action.INSERT",
    ...(targetPackage ? [`package=${targetPackage}`] : []),
    "type=vnd.android.cursor.item/event",
    `S.title=${androidIntentValue(params.title)}`,
    ...(params.location ? [`S.eventLocation=${androidIntentValue(params.location)}`] : []),
    ...(params.description ? [`S.description=${androidIntentValue(params.description)}`] : []),
    `l.beginTime=${params.start.getTime()}`,
    `l.endTime=${params.end.getTime()}`,
    "end",
  ].join(";");
}

function buildCalendarHref(params: CalendarButtonParams, option: CalendarOption): string {
  if (isAndroid()) {
    return buildAndroidCalendarIntent(
      params,
      option === "google" ? "com.google.android.calendar" : undefined,
    );
  }

  return option === "google"
    ? buildGoogleCalendarHref(params.sessionId)
    : buildIcsHref(params.sessionId);
}

/**
 * Fires the Android calendar insert intent via window.location.href.
 * Uses intent://#Intent format (no scheme=content, no host) which is the
 * format that works across Samsung Calendar, AOSP Calendar, and Google Calendar.
 * Shows a WebView warning if the intent fails after 1.5s.
 */
function triggerAndroidCalendar(params: CalendarButtonParams): void {
  const intentUrl =
    "intent://#Intent;" +
    "action=android.intent.action.INSERT;" +
    "type=vnd.android.cursor.dir/event;" +
    "S.title=" + androidIntentValue(params.title) + ";" +
    (params.description ? "S.description=" + androidIntentValue(params.description) + ";" : "") +
    (params.location ? "S.eventLocation=" + androidIntentValue(params.location) + ";" : "") +
    "l.beginTime=" + params.start.getTime() + ";" +
    "l.endTime=" + params.end.getTime() + ";" +
    "end";

  window.location.href = intentUrl;

  // If stuck in a QR scanner WebView the intent will fail silently.
  // After 1.5s, if the user is still on the page, prompt them to open in Chrome.
  setTimeout(() => {
    alert(
      "Your QR scanner is blocking the calendar app. Please tap the three dots in the top right corner, select 'Open in Chrome' or 'Open in Browser', and tap the button again."
    );
  }, 1500);
}

// Accent colors for each session card (cycles through 4)
const SESSION_ACCENTS = [
  { gradient: "linear-gradient(90deg, #7C3AED, #9F67FF)", glow: "rgba(124,58,237,0.45)" },
  { gradient: "linear-gradient(90deg, #0EA5E9, #38BDF8)", glow: "rgba(14,165,233,0.45)" },
  { gradient: "linear-gradient(90deg, #10B981, #34D399)", glow: "rgba(16,185,129,0.45)" },
  { gradient: "linear-gradient(90deg, #F59E0B, #FCD34D)", glow: "rgba(245,158,11,0.45)" },
];

function CalendarButtons({
  params,
}: {
  params: CalendarButtonParams;
}) {
  const googleHref = buildCalendarHref(params, "google");
  const otherHref = buildCalendarHref(params, "other");
  const android = isAndroid();

  return (
    <div className="mt-4 space-y-2">
      {/* Google Calendar — anchor for non-Android, button+intent for Android */}
      {android ? (
        <button
          type="button"
          onClick={() => triggerAndroidCalendar(params)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-green-600 bg-green-50 px-4 py-3 text-sm font-bold text-green-700 shadow-sm transition-all duration-150 active:scale-95"
        >
          <CalendarPlus className="h-4 w-4" />
          Android Calendar
        </button>
      ) : (
        <a
          href={googleHref}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-500 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 shadow-sm transition-all duration-150 active:scale-95"
        >
          <CalendarPlus className="h-4 w-4" />
          Google Calendar
        </a>
      )}

      {/* iPhone / Outlook / Other — always an anchor to the .ics endpoint */}
      <a
        href={otherHref}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all duration-150 active:scale-95"
      >
        <CalendarPlus className="h-4 w-4" />
        iPhone / Outlook / Other
      </a>
    </div>
  );
}

export default function Tableside() {
  const now = useMemo(() => new Date(), []);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: sessions = [], isLoading } = trpc.tableside.list.useQuery({ month, year });

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
          <span className="font-semibold">Pick a session that works for you</span> and choose the calendar option that matches your device or app.
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
          const calendarParams: CalendarButtonParams = {
            sessionId: session.id,
            title: session.title,
            start,
            end,
            location: session.location,
            description: session.description,
          };

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

                <CalendarButtons params={calendarParams} />
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
