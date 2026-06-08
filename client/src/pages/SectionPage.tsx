import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  HeartHandshake,
  Megaphone,
  ShieldCheck,
  UserCheck,
  Utensils,
  Circle,
  Mail,
  Phone,
} from "lucide-react";
import { Link } from "wouter";

const ICON_MAP: Record<string, React.ElementType> = {
  "calendar-check": CalendarDays,
  "utensils": Utensils,
  "file-text": FileText,
  "heart-handshake": HeartHandshake,
  "shield-check": ShieldCheck,
  "user-check": UserCheck,
  "megaphone": Megaphone,
  "circle": Circle,
};

interface SectionPageProps {
  sectionKey: string;
  // Static fallback content if DB has nothing yet
  fallbackTitle?: string;
  fallbackBody?: string;
  fallbackCta?: { label: string; href: string };
}

export default function SectionPage({
  sectionKey,
  fallbackTitle,
  fallbackBody,
  fallbackCta,
}: SectionPageProps) {
  const { data: sections = [] } = trpc.sections.list.useQuery();
  const { data: contentItems = [], isLoading } = trpc.content.get.useQuery({ sectionKey });
  const { data: settings = {} } = trpc.settings.get.useQuery();

  const section = sections.find((s) => s.key === sectionKey);
  const IconComponent = section ? (ICON_MAP[section.icon] ?? Circle) : Circle;
  const color = section?.color ?? "#3B82F6";
  const label = section?.label ?? fallbackTitle ?? "Wellness";

  const contactName = settings["contact_name"] ?? "";
  const contactEmail = settings["contact_email"] ?? "";
  const contactPhone = settings["contact_phone"] ?? "";

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
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <h1
              className="font-display text-2xl font-black text-white"
              style={{ fontFamily: "Poppins, Inter, sans-serif" }}
            >
              {label}
            </h1>
          </div>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <main className="space-y-3 px-4 pb-10">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-700/50" />
            ))}
          </div>
        )}

        {!isLoading && contentItems.length === 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-lg">
            {fallbackTitle && (
              <h2
                className="font-display text-lg font-bold text-slate-900"
                style={{ fontFamily: "Poppins, Inter, sans-serif" }}
              >
                {fallbackTitle}
              </h2>
            )}
            {fallbackBody && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{fallbackBody}</p>
            )}
            {fallbackCta && (
              <a
                href={fallbackCta.href}
                className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
              >
                <ExternalLink className="h-4 w-4" />
                {fallbackCta.label}
              </a>
            )}
          </div>
        )}

        {contentItems.map((item, i) => {
          const staggerClass = `stagger-${Math.min(i + 1, 7)}`;
          return (
            <div
              key={item.id}
              className={`animate-fade-up ${staggerClass} overflow-hidden rounded-2xl bg-white shadow-lg`}
            >
              <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
              <div className="p-4">
                {item.title && (
                  <h2
                    className="font-display text-base font-bold text-slate-900"
                    style={{ fontFamily: "Poppins, Inter, sans-serif" }}
                  >
                    {item.title}
                  </h2>
                )}
                {item.body && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {item.contentType === "link" ? "Open Resource" : "Learn More"}
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {/* Contact card */}
        {(contactName || contactEmail || contactPhone) && (
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800/60 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Questions? Contact Your Health Coach
            </p>
            {contactName && (
              <p className="mt-1 text-sm font-semibold text-slate-300">{contactName}</p>
            )}
            <div className="mt-2 flex flex-col items-center gap-1">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <Mail className="h-3 w-3" />
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <a
                  href={`tel:${contactPhone.replace(/\D/g, "")}`}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
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
