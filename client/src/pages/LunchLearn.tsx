import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  MessageSquare,
  ExternalLink,
  PlayCircle,
  FileText,
  Circle,
  Utensils,
  Mail,
  Phone,
  Video,
} from "lucide-react";
import { Link } from "wouter";

const SMS_NUMBER = "4696366066";
const SMS_BODY = encodeURIComponent("RSVP for the Lunch and Learn");

export default function LunchLearn() {
  const { data: sections = [] } = trpc.sections.list.useQuery();
  const { data: contentItems = [], isLoading } = trpc.content.get.useQuery({ sectionKey: "lunch-learn" });
  const { data: settings = {} } = trpc.settings.get.useQuery();

  const section = sections.find((s) => s.key === "lunch-learn");
  const color = section?.color ?? "#0EA5E9";
  const label = section?.label ?? "Lunch & Learn";

  const contactName = settings["contact_name"] ?? "";
  const contactEmail = settings["contact_email"] ?? "";
  const contactPhone = settings["contact_phone"] ?? "";
  const rsvpUrl = settings["lunch_learn_rsvp_url"] ?? "";

  // Split content into upcoming/current info blocks vs past recordings
  const infoBlocks = contentItems.filter((item) => item.contentType !== "recording");
  const recordings = contentItems.filter((item) => item.contentType === "recording");

  const smsHref = `sms:${SMS_NUMBER}?body=${SMS_BODY}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden px-4 pb-6 pt-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
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
              style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
            >
              <Utensils className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-display text-2xl font-black text-white" style={{ fontFamily: "Poppins, Inter, sans-serif" }}>
              {label}
            </h1>
          </div>
        </div>
      </header>

      <main className="space-y-3 px-4 pb-10">
        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-700/50" />
            ))}
          </div>
        )}

        {/* Info / upcoming content blocks */}
        {!isLoading && infoBlocks.length === 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="font-display text-lg font-bold text-slate-900" style={{ fontFamily: "Poppins, Inter, sans-serif" }}>
              Strength Reserve: Why It Matters More Than You Think
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Many of us do not notice our strength reserve disappearing until life starts feeling harder than it should.
              This is not about lifting heavy weights or becoming a &ldquo;gym person.&rdquo; It is about understanding
              strength as one of the most practical forms of long-term health protection you have. Join us for an upcoming
              Lunch &amp; Learn to learn more.
            </p>
          </div>
        )}

        {infoBlocks.map((item, i) => (
          <div
            key={item.id}
            className={`animate-fade-up stagger-${Math.min(i + 1, 7)} overflow-hidden rounded-2xl bg-white shadow-lg`}
          >
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
            <div className="p-4">
              {item.title && (
                <h2 className="font-display text-base font-bold text-slate-900" style={{ fontFamily: "Poppins, Inter, sans-serif" }}>
                  {item.title}
                </h2>
              )}
              {item.body && <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Resource
                </a>
              )}
            </div>
          </div>
        ))}

        {/* ── RSVP Section ──────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
          <div className="p-4">
            <p className="mb-1 text-sm font-bold text-slate-800">Ready to join us?</p>
            <p className="mb-4 text-xs text-slate-500">RSVP by text — just tap and hit send.</p>

            {/* SMS RSVP — primary */}
            <a
              href={smsHref}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-150 active:scale-[0.97]"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
            >
              <MessageSquare className="h-4 w-4" />
              RSVP by Text
            </a>

            {/* Optional admin-set RSVP link as secondary */}
            {rsvpUrl && (
              <a
                href={rsvpUrl}
                target={rsvpUrl.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-150 active:scale-[0.97]"
              >
                <ExternalLink className="h-4 w-4" />
                RSVP via Form
              </a>
            )}
          </div>
        </div>

        {/* ── Past Recordings ───────────────────────────────────────────── */}
        {recordings.length > 0 && (
          <div className="mt-2">
            <p className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-slate-500">
              Past Sessions — Watch at Your Leisure
            </p>
            <div className="space-y-3">
              {recordings.map((item, i) => (
                <div
                  key={item.id}
                  className={`animate-fade-up stagger-${Math.min(i + 1, 7)} overflow-hidden rounded-2xl bg-white shadow-lg`}
                >
                  <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}66, ${color}33)` }} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `${color}20` }}
                      >
                        <Video className="h-4 w-4" style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        {item.title && (
                          <p className="text-sm font-bold text-slate-900">{item.title}</p>
                        )}
                        {item.body && (
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.body}</p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center gap-1.5 text-xs font-bold"
                            style={{ color }}
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            Watch Recording
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty past recordings placeholder ─────────────────────────── */}
        {!isLoading && recordings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 p-5 text-center">
            <Video className="mx-auto mb-2 h-6 w-6 text-slate-600" />
            <p className="text-xs font-semibold text-slate-500">Past session recordings coming soon</p>
            <p className="mt-0.5 text-xs text-slate-600">Check back after each Lunch &amp; Learn</p>
          </div>
        )}

        {/* Contact card */}
        {(contactName || contactEmail || contactPhone) && (
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800/60 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Questions? Contact Your Health Coach
            </p>
            {contactName && <p className="mt-1 text-sm font-semibold text-slate-300">{contactName}</p>}
            <div className="mt-2 flex flex-col items-center gap-1">
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                  <Mail className="h-3 w-3" />
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <a href={`tel:${contactPhone.replace(/\D/g, "")}`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                  <Phone className="h-3 w-3" />
                  {contactPhone}
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
