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

export default function Tableside() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: sessions = [], isLoading } = trpc.tableside.list.useQuery({ month, year });

  const handleAddToCalendar = (sessionId: number) => {
    // Navigate to the .ics endpoint — the server responds with
    // Content-Type: text/calendar which triggers the native calendar
    // "Add" sheet on iOS and the Google Calendar save preview on Android.
    window.location.href = `/api/calendar/${sessionId}`;
  };

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
            <button className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
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
      <div className="mx-4 mb-4 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3">
        <p className="text-sm leading-relaxed text-purple-200">
          <span className="font-semibold">Tap "Add to Calendar"</span> on any session
          below — your phone will instantly open the calendar save screen. No extra
          steps.
        </p>
      </div>

      {/* ── Session Cards ─────────────────────────────────────────────────── */}
      <main className="space-y-3 px-4 pb-10">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-700/50" />
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
          const staggerClass = `stagger-${Math.min(i + 1, 7)}`;

          return (
            <div
              key={session.id}
              className={`animate-fade-up ${staggerClass} overflow-hidden rounded-2xl bg-white shadow-lg`}
            >
              {/* Color accent bar */}
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #7C3AED, #9F67FF)" }} />

              <div className="p-4">
                <h2 className="font-display text-base font-bold leading-snug text-slate-900" style={{ fontFamily: "Poppins, Inter, sans-serif" }}>
                  {session.title}
                </h2>

                {session.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {session.description}
                  </p>
                )}

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Clock className="h-4 w-4 shrink-0 text-purple-600" />
                    <span>
                      <span className="font-semibold">{formatDay(start)}</span>
                      <span className="ml-1 text-slate-500">{formatTimeRange(start, end)}</span>
                    </span>
                  </div>

                  {session.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <MapPin className="h-4 w-4 shrink-0 text-purple-600" />
                      <span>{session.location}</span>
                    </div>
                  )}
                </div>

                {/* Add to Calendar CTA */}
                <button
                  onClick={() => handleAddToCalendar(session.id)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-150 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #9F67FF 100%)",
                    boxShadow: "0 4px 14px -2px rgba(124,58,237,0.5)",
                  }}
                >
                  <CalendarPlus className="h-4 w-4" />
                  Add to Calendar
                </button>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
