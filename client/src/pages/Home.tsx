import { trpc } from "@/lib/trpc";
import {
  CalendarCheck,
  ChevronRight,
  FileText,
  HeartHandshake,
  Megaphone,
  ShieldCheck,
  UserCheck,
  Utensils,
  Circle,
  Phone,
  Mail,
} from "lucide-react";
import { Link } from "wouter";

// Map icon string keys from the DB to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  "calendar-check": CalendarCheck,
  "utensils": Utensils,
  "file-text": FileText,
  "heart-handshake": HeartHandshake,
  "shield-check": ShieldCheck,
  "user-check": UserCheck,
  "megaphone": Megaphone,
  "circle": Circle,
};

export default function Home() {
  const { data: sections = [] } = trpc.sections.list.useQuery();
  const { data: settings = {} } = trpc.settings.get.useQuery();

  const activeSections = sections.filter((s) => s.isActive);

  const headline = settings["month_headline"] || "What's Happening This Month";
  const subheadline = settings["month_subheadline"] || "Strength · Safety · Awareness";
  const description =
    settings["month_theme_description"] ||
    "Your wellness hub — one scan, everything you need.";
  const contactName = settings["contact_name"] || "";
  const contactEmail = settings["contact_email"] || "";
  const contactPhone = settings["contact_phone"] || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden px-5 pb-8 pt-10 text-center">
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full opacity-10 blur-2xl"
          style={{ background: "radial-gradient(circle, #0EA5E9 0%, transparent 70%)" }}
        />

        <div className="relative animate-fade-up">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Employee Wellness Hub
          </p>
          <h1
            className="font-display text-3xl font-black leading-tight text-white"
            style={{ fontFamily: "Poppins, Inter, sans-serif" }}
          >
            {headline}
          </h1>
          <p className="mt-1 text-sm font-semibold tracking-widest text-slate-300">
            {subheadline}
          </p>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
            {description}
          </p>
        </div>
      </header>

      {/* ── Section Buttons ───────────────────────────────────────────────── */}
      <main className="px-4 pb-10">
        <div className="grid grid-cols-1 gap-3">
          {activeSections.map((section, i) => {
            const IconComponent = ICON_MAP[section.icon] ?? Circle;
            const staggerClass = `stagger-${Math.min(i + 1, 7)}`;

            return (
              <Link key={section.key} href={section.route}>
                <button
                  className={`section-card-hover animate-fade-up ${staggerClass} group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 text-left shadow-lg`}
                  style={{
                    background: `linear-gradient(135deg, ${section.color}ee 0%, ${section.color}bb 100%)`,
                  }}
                >
                  {/* Shine overlay */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)",
                    }}
                  />

                  {/* Icon circle */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <IconComponent className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>

                  {/* Label */}
                  <span className="flex-1 text-base font-bold leading-snug text-white drop-shadow-sm">
                    {section.label}
                  </span>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 shrink-0 text-white/70 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </Link>
            );
          })}

          {/* Fallback when DB hasn't loaded yet */}
          {activeSections.length === 0 &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] animate-pulse rounded-2xl bg-slate-700/50"
              />
            ))}
        </div>
      </main>

      {/* ── Footer / Contact ──────────────────────────────────────────────── */}
      {(contactName || contactEmail || contactPhone) && (
        <footer className="border-t border-slate-700/50 px-5 py-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Questions?
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
        </footer>
      )}
    </div>
  );
}
