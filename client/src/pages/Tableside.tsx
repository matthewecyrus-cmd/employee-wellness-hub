import { trpc } from "@/lib/trpc";
import { ArrowLeft, CalendarPlus, Clock, MapPin, Smartphone, Apple } from "lucide-react";
import { Link } from "wouter";

function buildGoogleCalendarUrl(
  title: string,
  description: string,
  location: string,
  start: Date,
  end: Date
): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: description,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

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

// Accent colors for each session card (cycles through 4)
const SESSION_ACCENTS = [
  { gradient: "linear-gradient(90deg, #7C3AED, #9F67FF)", glow: "rgba(124,58,237,0.45)" },
  { gradient: "linear-gradient(90deg, #0EA5E9, #38BDF8)", glow: "rgba(14,165,233,0.45)" },
  { gradient: "linear-gradient(90deg, #10B981, #34D399)", glow: "rgba(16,185,129,0.45)" },
  { gradient: "linear-gradient(90deg, #F59E0B, #FCD34D)", glow: "rgba(245,158,11,0.45)" },
];

type Accent = { gradient: string; glow: string };

interface CalendarButtonsProps {
  session: {
    id: number;
    title: string;
    description?: string | null;
    location?: string | null;
    startTime: Date;
    endTime: Date;
  };
  accent: Accent;
}

function CalendarButtons({ session, accent }: CalendarButtonsProps) {
  const start = new Date(session.startTime);
  const end = new Date(session.endTime);
  const googleUrl = buildGoogleCalendarUrl(
    session.title,
    session.description ?? "",
    session.location ?? "",
    start,
    end
  );

  return (
    <div className="mt-4 flex gap-2">
      {/* Android → Google Calendar (opens in browser, user taps Save) */}
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-bold text-white shadow-md transition-all duration-150 active:scale-95"
        style={{
          background: "linear-gradient(90deg, #22C55E, #16A34A)",
          boxShadow: "0 4px 14px -2px rgba(34,197,94,0.45)",
        }}
      >
        <Smartphone className="h-4 w-4 shrink-0" />
        Android
      </a>

      {/* iPhone / Outlook → ICS file */}
      <a
        href={`/api/tableside/${session.id}.ics`}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-bold text-white shadow-md transition-all duration-150 active:scale-95"
        style={{
          background: accent.gradient,
          boxShadow: `0 4px 14px -2px ${accent.glow}`,
        }}
      >
        <Apple className="h-4 w-4 shrink-0" />
        iPhone
      </a>
    </div>
  );
}

export default function Tableside() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: sessions = [], isLoading } = trpc.tableside.list.useQuery({ month, year });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden px-4 pb-6 pt-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)" }}
        />

        <div className="relative">
          <Link href="/">
            <button 
              className="mb-4 flex items-center gap-2 rounded-lg bg-slate-700/60 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-150"
              aria-label="Back to main hub"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Hub
            </button>
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #7C3AED, #9F67FF)" }}
            >
              <CalendarPlus className="h-6 w-6 text-white" aria-hidden="true" />
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
          <span className="font-semibold">Pick a session that works for you.</span> Tap{" "}
          <strong>Android</strong> or <strong>iPhone</strong> to add it to your calendar.
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
            <CalendarPlus className="mx-auto mb-3 h-10 w-10 text-slate-600" aria-hidden="true" />
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
          return (
            <div
              key={session.id}
              className="overflow-hidden rounded-2xl bg-white shadow-lg"
            >
              {/* Color accent bar */}
              <div className="h-1.5 w-full" style={{ background: accent.gradient }} aria-hidden="true" />

              <div className="p-4">
                {/* Session number badge */}
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: accent.gradient }}
                    aria-hidden="true"
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
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" aria-hidden="true" />
                    <div>
                      <div className="font-semibold">{formatDay(start)}</div>
                      <div className="text-slate-500">{formatTimeRange(start, end)}</div>
                    </div>
                  </div>

                  {session.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <MapPin className="h-4 w-4 shrink-0 text-purple-600" aria-hidden="true" />
                      <span className="font-medium">{session.location}</span>
                    </div>
                  )}
                </div>

                {/* ── Calendar CTA ──────────────────────────────────────────── */}
                <CalendarButtons session={session} accent={accent} />
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
