import { useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Download, CheckCircle } from "lucide-react";

export default function AndroidCalendarHelp() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const downloadedRef = useRef(false);

  // Auto-trigger the ICS download as soon as the page loads
  useEffect(() => {
    if (downloadedRef.current) return;
    downloadedRef.current = true;
    const link = document.createElement("a");
    link.href = `/api/tableside/${params.id}.ics`;
    link.download = "calendar-event.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [params.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate("/tableside")}
        className="mb-6 flex items-center gap-2 rounded-lg bg-slate-700/60 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-150"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-400">
          <Download className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: "Poppins, Inter, sans-serif" }}>
            Save to Samsung Calendar
          </h1>
          <p className="text-sm text-slate-400">Follow these steps on your phone</p>
        </div>
      </div>

      {/* Status banner */}
      <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3">
        <p className="text-sm font-semibold text-green-300">
          ✅ Your calendar file is downloading now — look at the bottom of your screen.
        </p>
      </div>

      {/* Step-by-step instructions */}
      <div className="space-y-4">
        <Step
          number={1}
          title='Look for the download bar at the bottom'
          description='A bar will appear at the very bottom of Chrome that says "calendar-event.ics". It may only show for a few seconds.'
          highlight
        />
        <Step
          number={2}
          title='Tap "Open" on that bar'
          description='Tap the "Open" button on the right side of the download bar. If you missed it, tap the three-dot menu in Chrome → Downloads → tap the file.'
        />
        <Step
          number={3}
          title="Samsung Calendar opens"
          description='Samsung Calendar will open and show you the event details — title, date, time, and location are already filled in.'
        />
        <Step
          number={4}
          title='Tap "Save" or "Add"'
          description="Tap the Save or Add button in Samsung Calendar to add the event to your calendar."
          last
        />
      </div>

      {/* Missed the bar? Re-download */}
      <div className="mt-8 rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-4">
        <p className="mb-3 text-sm font-semibold text-slate-300">Missed the download bar?</p>
        <a
          href={`/api/tableside/${params.id}.ics`}
          download="calendar-event.ics"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-400 px-4 py-3 text-sm font-bold text-white shadow-md active:scale-95 transition-all duration-150"
        >
          <Download className="h-4 w-4" />
          Download Again
        </a>
        <p className="mt-2 text-xs text-slate-500 text-center">
          Then tap "Open" in the bar that appears at the bottom of your screen.
        </p>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  highlight,
  last,
}: {
  number: number;
  title: string;
  description: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <div className="flex gap-4">
      {/* Number + connector line */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${
            highlight
              ? "bg-gradient-to-br from-amber-500 to-amber-400 shadow-lg shadow-amber-500/30"
              : "bg-gradient-to-br from-violet-600 to-violet-400"
          }`}
        >
          {number}
        </div>
        {!last && <div className="mt-1 w-0.5 flex-1 bg-slate-700" />}
      </div>

      {/* Content */}
      <div className={`pb-4 ${last ? "" : ""}`}>
        <p className={`font-bold ${highlight ? "text-amber-300" : "text-white"}`}>{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
    </div>
  );
}
