import { trpc } from "@/lib/trpc";
import { ArrowLeft, CalendarPlus, Clock, MapPin } from "lucide-react";
import { useEffect, type MouseEvent } from "react";
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
 * Builds an Android calendar intent:// URI using ACTION_INSERT.
 * Uses intent://insert#Intent which is handled by all Android calendar apps.
 */
function buildAndroidIntentUrl(params: {
  title: string;
  start: Date;
  end: Date;
  location?: string | null;
  description?: string | null;
  sessionId: number;
}): string {
  const parts = [
    "intent://insert#Intent",
    "action=android.intent.action.INSERT",
    "type=vnd.android.cursor.dir/event",
    `S.title=${encodeURIComponent(params.title)}`,
    params.location ? `S.eventLocation=${encodeURIComponent(params.location)}` : null,
    params.description ? `S.description=${encodeURIComponent(params.description)}` : null,
    `l.beginTime=${params.start.getTime()}`,
    `l.endTime=${params.end.getTime()}`,
    "end",
  ].filter(Boolean).join(";");
  return parts;
}

/** Returns true when running on an Android browser. */
function isAndroid(): boolean {
  const uaDataPlatform = "userAgentData" in navigator
    ? (navigator.userAgentData as { platform?: string }).platform
    : "";
  const desktopModeAndroid = /linux/i.test(navigator.userAgent) && navigator.maxTouchPoints > 0;

  return /android/i.test(navigator.userAgent) || /android/i.test(uaDataPlatform || "") || desktopModeAndroid;
}

/** Returns true for iPhone/iPad Safari and iOS WebKit browsers. */
function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function buildCalendarHref(params: {
  title: string;
  start: Date;
  end: Date;
  location?: string | null;
  description?: string | null;
  sessionId: number;
}): string {
  if (isAndroid()) {
    return buildAndroidIntentUrl(params);
  }
  return `/api/tableside/${params.sessionId}`;
}

function buildCalendarFileName(title: string): string {
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${safeTitle || "tableside-session"}.ics`;
}

async function openIOSCalendarShare(params: {
  title: string;
  sessionId: number;
}): Promise<boolean> {
  const endpoint = `/api/tableside/${params.sessionId}`;

  if (!("share" in navigator)) {
    return false;
  }

  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) {
    return false;
  }

  const icsText = await response.text();
  const file = new File([icsText], buildCalendarFileName(params.title), {
    type: "text/calendar",
  });
  const shareData = {
    title: params.title,
    files: [file],
  };

  if ("canShare" in navigator && !navigator.canShare(shareData)) {
    return false;
  }

  await navigator.share(shareData);
  return true;
}

// Accent colors for each session card (cycles through 4)
const SESSION_ACCENTS = [
  { gradient: "linear-gradient(90deg, #7C3AED, #9F67FF)", glow: "rgba(124,58,237,0.45)" },
  { gradient: "linear-gradient(90deg, #0EA5E9, #38BDF8)", glow: "rgba(14,165,233,0.45)" },
  { gradient: "linear-gradient(90deg, #10B981, #34D399)", glow: "rgba(16,185,129,0.45)" },
  { gradient: "linear-gradient(90deg, #F59E0B, #FCD34D)", glow: "rgba(245,158,11,0.45)" },
];

export default function Tableside() {
  // Eruda mobile debug launcher — remove after debugging
  useEffect(() => {
    // Inject eruda script
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    document.body.appendChild(script);

    const w = window as unknown as Record<string, { init: () => void; show: () => void } | undefined>;

    const setup = () => {
      if (w["eruda"]) {
        w["eruda"]!.init();
      }

      // OPEN DEVTOOLS button
      const btn = document.createElement("button");
      btn.textContent = "OPEN DEVTOOLS";
      btn.style.position = "fixed";
      btn.style.right = "12px";
      btn.style.bottom = "80px";
      btn.style.zIndex = "999999";
      btn.style.padding = "12px 14px";
      btn.style.borderRadius = "10px";
      btn.style.border = "2px solid #000";
      btn.style.background = "#ffeb3b";
      btn.style.color = "#000";
      btn.style.fontSize = "13px";
      btn.style.fontWeight = "800";
      btn.style.boxShadow = "0 4px 12px rgba(0,0,0,.35)";
      btn.onclick = () => {
        if (w["eruda"]) {
          w["eruda"]!.show();
        } else {
          alert("Eruda did not load.");
        }
      };
      document.body.appendChild(btn);

      // Status indicator
      const status = document.createElement("div");
      status.textContent = w["eruda"] ? "Eruda loaded" : "Eruda NOT loaded";
      status.style.position = "fixed";
      status.style.left = "12px";
      status.style.bottom = "80px";
      status.style.zIndex = "999999";
      status.style.padding = "10px 12px";
      status.style.borderRadius = "10px";
      status.style.background = w["eruda"] ? "#d1fae5" : "#fee2e2";
      status.style.color = "#000";
      status.style.fontSize = "12px";
      status.style.fontWeight = "700";
      document.body.appendChild(status);
    };

    if (document.readyState === "complete") {
      // Give eruda script a tick to execute after appending
      script.onload = setup;
    } else {
      window.addEventListener("load", setup, { once: true });
    }

    return () => {
      // cleanup on unmount
      document.querySelectorAll("[data-eruda-debug]").forEach((el) => el.remove());
    };
  }, []);

  const now = new Date();
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
          const calendarHref = buildCalendarHref({
            title: session.title,
            start,
            end,
            location: session.location,
            description: session.description,
            sessionId: session.id,
          });
          const handleCalendarClick = async (event: MouseEvent<HTMLAnchorElement>) => {
            if (!isIOS() || isAndroid()) {
              return;
            }

            event.preventDefault();

            const openedShareSheet = await openIOSCalendarShare({
              title: session.title,
              sessionId: session.id,
            });

            if (!openedShareSheet) {
              window.location.href = `/api/tableside/${session.id}`;
            }
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

                {/* ── Calendar CTA ──────────────────────────────────────── */}
                <a
                  href={calendarHref}
                  onClick={handleCalendarClick}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-150 active:scale-95"
                  style={{
                    background: accent.gradient,
                    boxShadow: `0 4px 14px -2px ${accent.glow}`,
                  }}
                >
                  <CalendarPlus className="h-4 w-4" />
                  Add to My Calendar
                </a>
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
