import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarPlus,
  Edit2,
  Loader2,
  Plus,
  Save,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionForm {
  id?: number;
  title: string;
  location: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  month: number;
  year: number;
  sortOrder: number;
}

const EMPTY_FORM: SessionForm = {
  title: "",
  location: "",
  description: "",
  startDate: "",
  startTime: "10:30",
  endTime: "11:30",
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  sortOrder: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISOString(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function toDateStr(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

function toTimeStr(d: Date): string {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

// ─── Password Login Form ──────────────────────────────────────────────────────

function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ password });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600">
            <Settings className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-slate-400">Enter your password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loginMutation.isPending || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60 active:scale-[0.97] transition-transform"
          >
            {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </button>
        </form>
        <Link href="/">
          <button className="mt-4 w-full rounded-xl bg-slate-800 py-3 text-sm text-slate-400 hover:text-white transition-colors">
            Back to Hub
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <AdminLoginForm />;
  }

  return <AdminDashboard />;
}

// ─── Admin Dashboard (shown only to admin users) ──────────────────────────────

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"sessions" | "sections" | "content" | "settings">("sessions");

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 px-4 py-4">
        <Link href="/">
          <button className="mb-3 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Hub
          </button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-slate-400">Manage your wellness hub content</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(["sessions", "sections", "content", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab === "sessions" ? "Sessions" : tab === "sections" ? "Sections" : tab === "content" ? "Content" : "Settings"}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-5">
        {activeTab === "sessions" && <SessionsManager />}
        {activeTab === "sections" && <SectionsManager />}
        {activeTab === "content" && <ContentManager />}
        {activeTab === "settings" && <SettingsManager />}
      </main>
    </div>
  );
}

// ─── Sessions Manager ─────────────────────────────────────────────────────────

function SessionsManager() {
  const utils = trpc.useUtils();
  const { data: sessions = [], isLoading } = trpc.tableside.listAll.useQuery();
  const createMutation = trpc.tableside.create.useMutation({
    onSuccess: () => {
      utils.tableside.listAll.invalidate();
      toast.success("Session created");
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.tableside.update.useMutation({
    onSuccess: () => {
      utils.tableside.listAll.invalidate();
      toast.success("Session updated");
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.tableside.delete.useMutation({
    onSuccess: () => {
      utils.tableside.listAll.invalidate();
      toast.success("Session deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SessionForm>(EMPTY_FORM);

  const handleEdit = (s: (typeof sessions)[0]) => {
    setForm({
      id: s.id,
      title: s.title,
      location: s.location,
      description: s.description ?? "",
      startDate: toDateStr(new Date(s.startTime)),
      startTime: toTimeStr(new Date(s.startTime)),
      endTime: toTimeStr(new Date(s.endTime)),
      month: s.month,
      year: s.year,
      sortOrder: s.sortOrder,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.startDate) {
      toast.error("Title and date are required");
      return;
    }
    const payload = {
      title: form.title,
      location: form.location,
      description: form.description,
      startTime: toISOString(form.startDate, form.startTime),
      endTime: toISOString(form.startDate, form.endTime),
      month: new Date(form.startDate).getMonth() + 1,
      year: new Date(form.startDate).getFullYear(),
      sortOrder: form.sortOrder,
    };
    if (form.id) {
      updateMutation.mutate({ id: form.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Tableside Sessions</h2>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Add Session
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-purple-500/30 bg-slate-800 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-white">
              {form.id ? "Edit Session" : "New Session"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">
                Session Title *
              </label>
              <input
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                placeholder="e.g. Tableside Activity: Tension Relief"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">
                Location
              </label>
              <input
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                placeholder="e.g. Bldg. 7 Breakroom"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                placeholder="Brief description of what employees will learn or do..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">
                Date *
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">
                  Start Time
                </label>
                <input
                  type="time"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">
                  End Time
                </label>
                <input
                  type="time"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">
                Sort Order (lower = first)
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {form.id ? "Save Changes" : "Create Session"}
            </button>
          </div>
        </div>
      )}

      {/* Session List */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </div>
      )}

      {!isLoading && sessions.length === 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 py-10 text-center">
          <CalendarPlus className="mx-auto mb-2 h-8 w-8 text-slate-600" />
          <p className="text-sm text-slate-400">No sessions yet. Add one above.</p>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map((s) => {
          const start = new Date(s.startTime);
          const end = new Date(s.endTime);
          return (
            <div
              key={s.id}
              className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-800 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{s.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {" · "}
                  {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  {" – "}
                  {end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
                {s.location && (
                  <p className="mt-0.5 text-xs text-slate-500">{s.location}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => handleEdit(s)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this session?")) {
                      deleteMutation.mutate({ id: s.id });
                    }
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-900/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Settings Manager ─────────────────────────────────────────────────────────

function SettingsManager() {
  const utils = trpc.useUtils();
  const { data: settings = {}, isLoading } = trpc.settings.get.useQuery();
  const upsertMany = trpc.settings.upsertMany.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const [local, setLocal] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  if (!isLoading && !initialized && Object.keys(settings).length > 0) {
    setLocal(settings);
    setInitialized(true);
  }

  const fields = [
    { key: "month_headline", label: "Month Headline", placeholder: "What's Happening in June" },
    { key: "month_subheadline", label: "Subheadline / Theme Tags", placeholder: "Strength · Safety · Awareness" },
    { key: "month_theme_description", label: "Theme Description", placeholder: "Brief description of this month's focus...", multiline: true },
    { key: "lunch_learn_rsvp_url", label: "Lunch & Learn RSVP Link", placeholder: "https://forms.office.com/... or mailto:..." },
    { key: "contact_name", label: "Contact Name", placeholder: "Matthew Cyrus" },
    { key: "contact_email", label: "Contact Email", placeholder: "name@company.com" },
    { key: "contact_phone", label: "Contact Phone", placeholder: "(469) 636-6066" },
  ];

  const handleSave = () => {
    const items = fields.map((f) => ({ key: f.key, value: local[f.key] ?? "" }));
    upsertMany.mutate(items);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-white">Hub Settings</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs font-semibold text-slate-400">
                {f.label}
              </label>
              {f.multiline ? (
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  placeholder={f.placeholder}
                  value={local[f.key] ?? ""}
                  onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
                />
              ) : (
                <input
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  placeholder={f.placeholder}
                  value={local[f.key] ?? ""}
                  onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={upsertMany.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {upsertMany.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </button>
        </div>
      )}

      {/* Change Admin Password */}
      <ChangePasswordSection />
    </div>
  );
}

// ─── Change Password Section ─────────────────────────────────────────────────

function ChangePasswordSection() {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const changePw = trpc.auth.adminChangePassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated");
      setNewPassword("");
      setConfirm("");
      setError("");
    },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    changePw.mutate({ newPassword });
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
      <h3 className="mb-3 text-sm font-bold text-white">Change Admin Password</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={changePw.isPending || !newPassword || !confirm}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-700 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
        >
          {changePw.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
        </button>
      </form>
    </div>
  );
}

// ─── Sections Manager ─────────────────────────────────────────────────────────

function SectionsManager() {
  const utils = trpc.useUtils();
  const { data: sections = [], isLoading } = trpc.sections.list.useQuery();
  const upsertMutation = trpc.sections.upsert.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate();
      toast.success("Section updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const COLORS = [
    { label: "Purple", value: "#7C3AED" },
    { label: "Sky", value: "#0EA5E9" },
    { label: "Green", value: "#10B981" },
    { label: "Amber", value: "#F59E0B" },
    { label: "Red", value: "#EF4444" },
    { label: "Blue", value: "#3B82F6" },
    { label: "Pink", value: "#EC4899" },
    { label: "Orange", value: "#F97316" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-white">Hub Sections</h2>
      <p className="text-xs text-slate-400">
        Toggle sections on/off and update their labels and colors. Changes appear on the home page immediately.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((s) => (
            <div key={s.key} className="rounded-xl border border-slate-700 bg-slate-800 p-3">
              <div className="flex items-center gap-3">
                {/* Color swatch */}
                <div
                  className="h-8 w-8 shrink-0 rounded-lg"
                  style={{ background: s.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{s.label}</p>
                  <p className="text-xs text-slate-500">{s.route}</p>
                </div>
                {/* Active toggle */}
                <button
                  onClick={() =>
                    upsertMutation.mutate({
                      key: s.key,
                      label: s.label,
                      icon: s.icon,
                      color: s.color,
                      route: s.route,
                      isActive: !s.isActive,
                      sortOrder: s.sortOrder,
                    })
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    s.isActive
                      ? "bg-green-600/20 text-green-400 hover:bg-red-600/20 hover:text-red-400"
                      : "bg-slate-700 text-slate-400 hover:bg-green-600/20 hover:text-green-400"
                  }`}
                >
                  {s.isActive ? "Visible" : "Hidden"}
                </button>
              </div>

              {/* Color picker row */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() =>
                      upsertMutation.mutate({
                        key: s.key,
                        label: s.label,
                        icon: s.icon,
                        color: c.value,
                        route: s.route,
                        isActive: s.isActive,
                        sortOrder: s.sortOrder,
                      })
                    }
                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      s.color === c.value ? "border-white" : "border-transparent"
                    }`}
                    style={{ background: c.value }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PDF Upload Button ───────────────────────────────────────────────────────

function PdfUploadButton({ onUploaded }: { onUploaded: (url: string, fileName: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large — max 10 MB");
      return;
    }

    setUploading(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data URL prefix: "data:application/pdf;base64,"
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/upload/tipsheet", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, dataBase64 }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }

      const { url } = await res.json() as { url: string; key: string };
      toast.success("File uploaded");
      onUploaded(url, file.name);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Uploading..." : "Upload PDF"}
      </button>
    </>
  );
}

// ─── Content Manager ──────────────────────────────────────────────────────────

const SECTION_KEYS = [
  { key: "tableside", label: "Tableside Activity" },
  { key: "lunch-learn", label: "Lunch & Learn" },
  { key: "resources", label: "Resources & Tip Sheets" },
  { key: "health-coaching", label: "Health Coaching" },
  { key: "safety", label: "National Safety Month" },
  { key: "mens-health", label: "Men's Health Month" },
  { key: "announcements", label: "Quick Announcements" },
];

function ContentManager() {
  const utils = trpc.useUtils();
  const [selectedKey, setSelectedKey] = useState("resources");
  const { data: contentItems = [], isLoading } = trpc.content.get.useQuery({ sectionKey: selectedKey });

  const createMutation = trpc.content.create.useMutation({
    onSuccess: () => {
      utils.content.get.invalidate();
      toast.success("Content added");
      setNewItem({ title: "", body: "", url: "", contentType: "text" });
      setShowNewForm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.content.update.useMutation({
    onSuccess: () => { utils.content.get.invalidate(); toast.success("Saved"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.content.delete.useMutation({
    onSuccess: () => { utils.content.get.invalidate(); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const [showNewForm, setShowNewForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", body: "", url: "", contentType: "text" });

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-white">Section Content</h2>

      {/* Section selector */}
      <select
        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
        value={selectedKey}
        onChange={(e) => setSelectedKey(e.target.value)}
      >
        {SECTION_KEYS.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Add Content Block
        </button>
        {selectedKey === "resources" && (
          <PdfUploadButton
            onUploaded={(url, fileName) => {
              createMutation.mutate({
                sectionKey: selectedKey,
                contentType: "link",
                title: fileName.replace(/\.pdf$/i, "").replace(/_/g, " "),
                url,
                sortOrder: contentItems.length,
              });
            }}
          />
        )}
      </div>

      {/* New content form */}
      {showNewForm && (
        <div className="rounded-2xl border border-purple-500/30 bg-slate-800 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-white">New Content Block</h3>
            <button onClick={() => setShowNewForm(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <select
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
              value={newItem.contentType}
              onChange={(e) => setNewItem({ ...newItem, contentType: e.target.value })}
            >
              <option value="text">Text Block</option>
              <option value="link">Link / Resource</option>
              <option value="announcement">Announcement</option>
              {selectedKey === "lunch-learn" && (
                <option value="recording">Past Recording / Video</option>
              )}
            </select>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              placeholder="Title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            />
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              placeholder="Body text..."
              value={newItem.body}
              onChange={(e) => setNewItem({ ...newItem, body: e.target.value })}
            />
            {(newItem.contentType === "link" || newItem.contentType === "recording") && (
              <input
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                placeholder={newItem.contentType === "recording" ? "YouTube, Teams, or SharePoint link..." : "https://..."}
                value={newItem.url}
                onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
              />
            )}
            <button
              onClick={() =>
                createMutation.mutate({
                  sectionKey: selectedKey,
                  contentType: newItem.contentType,
                  title: newItem.title,
                  body: newItem.body,
                  url: newItem.url,
                  sortOrder: contentItems.length,
                })
              }
              disabled={createMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Add Block
            </button>
          </div>
        </div>
      )}

      {/* Content list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </div>
      ) : contentItems.length === 0 ? (
        <p className="rounded-xl border border-slate-700 bg-slate-800/50 py-8 text-center text-sm text-slate-400">
          No content blocks yet for this section.
        </p>
      ) : (
        <div className="space-y-2">
          {contentItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-700 bg-slate-800 p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{item.title || "(no title)"}</p>
                  {item.body && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{item.body}</p>
                  )}
                  {item.url && (
                    <p className="mt-0.5 truncate text-xs text-blue-400">{item.url}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() =>
                      updateMutation.mutate({ id: item.id, isActive: !item.isActive })
                    }
                    className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                      item.isActive ? "bg-green-600/20 text-green-400" : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {item.isActive ? "On" : "Off"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this content block?")) {
                        deleteMutation.mutate({ id: item.id });
                      }
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-900/40 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
