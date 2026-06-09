import { CalendarPlus } from "lucide-react";
import { type MouseEvent } from "react";

interface CalendarButtonsProps {
  sessionId: number;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string | null;
  description?: string | null;
  accentGradient: string;
  accentGlow: string;
}

/** Returns true when running on an Android browser. */
function isAndroid(): boolean {
  const uaDataPlatform = "userAgentData" in navigator
    ? (navigator.userAgentData as { platform?: string }).platform
    : "";
  const hasTouchPoints = navigator.maxTouchPoints > 0;
  const desktopModeAndroid =
    hasTouchPoints &&
    (/linux/i.test(navigator.userAgent) || /windows nt/i.test(navigator.userAgent));

  return /android/i.test(navigator.userAgent) || /android/i.test(uaDataPlatform || "") || desktopModeAndroid;
}

/** Returns true for iPhone/iPad Safari and iOS WebKit browsers. */
function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Builds an Android calendar intent:// URI using ACTION_INSERT.
 * Works with Google Calendar, Samsung Calendar, and other Android calendar apps.
 */
function buildAndroidIntentUrl(params: {
  title: string;
  start: Date;
  end: Date;
  location?: string | null;
  description?: string | null;
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

function buildCalendarFileName(title: string): string {
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${safeTitle || "tableside-session"}.ics`;
}

/**
 * Attempts to share calendar file via native share sheet on iOS.
 * Falls back to direct download if Web Share API is unavailable.
 */
async function openIOSCalendarShare(params: {
  title: string;
  sessionId: number;
}): Promise<boolean> {
  const endpoint = `/api/tableside/${params.sessionId}`;

  if (!("share" in navigator)) {
    return false;
  }

  try {
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
  } catch (error) {
    console.error("Failed to share calendar file:", error);
    return false;
  }
}

export default function CalendarButtons({
  sessionId,
  title,
  startTime,
  endTime,
  location,
  description,
  accentGradient,
  accentGlow,
}: CalendarButtonsProps) {
  // Android button handler — let intent:// URI be handled by browser
  const handleAndroidClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isAndroid()) {
      e.preventDefault();
      return;
    }
    // Allow default navigation to trigger intent://
  };

  // iOS button handler — attempt Web Share API, fall back to direct download
  const handleIOSClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (isAndroid() || !isIOS()) {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    const openedShareSheet = await openIOSCalendarShare({
      title,
      sessionId,
    });

    if (!openedShareSheet) {
      // Fallback to direct ICS download
      window.location.href = `/api/tableside/${sessionId}`;
    }
  };

  const androidIntentUrl = buildAndroidIntentUrl({
    title,
    start: startTime,
    end: endTime,
    location,
    description,
  });

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {/* Android Calendar Button */}
      <a
        href={androidIntentUrl}
        onClick={handleAndroidClick}
        aria-label={`Add "${title}" to Android calendar`}
        className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-white shadow-md transition-all duration-150 active:scale-95 hover:opacity-90"
        style={{
          background: accentGradient,
          boxShadow: `0 4px 14px -2px ${accentGlow}`,
        }}
      >
        <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">Android</span>
      </a>

      {/* iPhone Calendar Button */}
      <a
        href={`/api/tableside/${sessionId}`}
        onClick={handleIOSClick}
        aria-label={`Add "${title}" to iPhone calendar`}
        className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-white shadow-md transition-all duration-150 active:scale-95 hover:opacity-90"
        style={{
          background: accentGradient,
          boxShadow: `0 4px 14px -2px ${accentGlow}`,
        }}
      >
        <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">iPhone</span>
      </a>
    </div>
  );
}
