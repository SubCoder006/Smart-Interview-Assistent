"use client";

// app/dashboard/settings/page.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { extractTextFromPDF } from "@/lib/pdfExtract";

// ─────────────────────────────────────────────────────────────────────────────
// Static config
// ─────────────────────────────────────────────────────────────────────────────

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const navItems = [
  { href: "/dashboard",           label: "Overview",  icon: "⬡" },
  { href: "/dashboard/interview", label: "Interview", icon: "⊙" },
  { href: "/dashboard/history",   label: "History",   icon: "▤" },
  { href: "/dashboard/settings",  label: "Settings",  icon: "⊕" },
];

const STYLES = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:        #070B12;
    --surface:   #0C1120;
    --card:      #101825;
    --border:    #1C2B40;
    --border2:   #243248;
    --lime:      #AAFF3C;
    --cyan:      #00E5C3;
    --violet:    #A78BFA;
    --coral:     #FF6B6B;
    --text:      #E8EFF8;
    --muted:     #5A6A85;
    --muted2:    #3A4D66;
    --font-head: 'Syne', sans-serif;
    --font-body: 'Plus Jakarta Sans', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
  .dot-grid {
    background-image: radial-gradient(circle, #1C2B40 1px, transparent 1px);
    background-size: 28px 28px;
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
  .input-field {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    color: var(--text) !important;
    border-radius: 10px !important;
    padding: 11px 14px !important;
    font-family: var(--font-body) !important;
    font-size: 14px !important;
    width: 100% !important;
    outline: none !important;
    transition: border-color 0.2s !important;
  }
  .input-field:focus { border-color: var(--lime) !important; }
  .input-field::placeholder { color: var(--muted) !important; }
  textarea.input-field { resize: vertical; min-height: 100px; line-height: 1.6; }
  input[type=range] { accent-color: var(--lime); width: 100%; }
`;

const LEVELS       = ["junior", "mid", "senior", "lead"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"]          as const;
const DIFF_COLOR: Record<string, string> = {
  easy:   "#AAFF3C",
  medium: "#00E5C3",
  hard:   "#FF6B6B",
};

const TABS = [
  { id: "profile",     label: "Profile",      icon: "◈" },
  { id: "preferences", label: "Preferences",  icon: "◎" },
  { id: "plan",        label: "Plan & Usage", icon: "◫" },
  { id: "account",     label: "Account",      icon: "◉" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SettingsForm {
  name: string;
  targetRole: string;
  targetLevel: string;
  preferredDifficulty: string;
  questionCount: number;
  targetCompanies: string;
  resumeText: string;
  skills: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components — OUTSIDE SettingsPage so references are stable across
// renders. If defined inside, every setState call recreates them as new
// function types, React unmounts + remounts their children, and inputs lose
// focus on every keystroke.
// ─────────────────────────────────────────────────────────────────────────────

const Card = ({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 18,
      padding: 28,
      marginBottom: 20,
      ...style,
    }}
  >
    {children}
  </div>
);

const SectionLabel = ({ text }: { text: string }) => (
  <p
    style={{
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--muted)",
      letterSpacing: "0.14em",
      marginBottom: 20,
    }}
  >
    {text}
  </p>
);

const FieldLabel = ({ text }: { text: string }) => (
  <label
    style={{
      fontSize: 12,
      color: "var(--muted)",
      marginBottom: 6,
      display: "block",
    }}
  >
    {text}
  </label>
);

const SaveBtn = ({
  onSave,
  saving,
}: {
  onSave: () => void;
  saving: boolean;
}) => (
  <motion.button
    whileHover={{ scale: 1.02, boxShadow: "0 0 22px rgba(170,255,60,0.25)" }}
    whileTap={{ scale: 0.97 }}
    onClick={onSave}
    disabled={saving}
    style={{
      background: saving ? "var(--border)" : "var(--lime)",
      color: saving ? "var(--muted)" : "#070B12",
      border: "none",
      borderRadius: 12,
      padding: "13px 28px",
      fontFamily: "var(--font-head)",
      fontSize: 14,
      fontWeight: 700,
      cursor: saving ? "not-allowed" : "pointer",
      transition: "all 0.2s",
    }}
  >
    {saving ? "Saving…" : "✓ Save Changes"}
  </motion.button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]["id"]>("profile");
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    targetRole: "",
    targetLevel: "mid",
    preferredDifficulty: "medium",
    questionCount: 5,
    targetCompanies: "",
    resumeText: "",
    skills: "",
  });
  const [saving, setSaving]             = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [userData, setUserData]         = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          setUserData(data.user);
          setForm({
            name:                data.user.name                                ?? "",
            targetRole:          data.user.preferences?.targetRole            ?? "",
            targetLevel:         data.user.preferences?.targetLevel           ?? "mid",
            preferredDifficulty: data.user.preferences?.preferredDifficulty  ?? "medium",
            questionCount:       data.user.preferences?.questionCount         ?? 5,
            targetCompanies:     (data.user.preferences?.targetCompanies ?? []).join(", "),
            resumeText:          data.user.resumeText                         ?? "",
            skills:              (data.user.skills ?? []).join(", "),
          });
        }
      } catch (_) {}
    })();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       form.name,
          resumeText: form.resumeText,
          skills:     form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          preferences: {
            targetRole:          form.targetRole,
            targetLevel:         form.targetLevel,
            preferredDifficulty: form.preferredDifficulty,
            questionCount:       form.questionCount,
            targetCompanies:     form.targetCompanies.split(",").map((s) => s.trim()).filter(Boolean),
          },
        }),
      });
      toast.success("Settings saved!");
    } catch (_) {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [form]);

  const handlePDFUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.includes("pdf")) {
        toast.error("Please upload a PDF file.");
        return;
      }

      setUploadingPDF(true);
      try {
        const text = await extractTextFromPDF(file);
        if (!text.trim()) {
          toast.error("Could not extract text from PDF.");
          return;
        }
        setForm((f) => ({ ...f, resumeText: text }));
        toast.success(`Resume uploaded! (${Math.round(text.length / 100)} chars)`);
      } catch (err) {
        console.error("PDF extraction error:", err);
        toast.error("Failed to extract PDF text. Try again.");
      } finally {
        setUploadingPDF(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleDeleteAccount = () => {
    toast(
      ({ closeToast }) => (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            Are you sure? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{ padding: "6px 14px", background: "#FF6B6B", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              onClick={() => { closeToast(); toast.info("Delete feature coming soon"); }}
            >
              Yes, delete
            </button>
            <button
              style={{ padding: "6px 14px", background: "#243248", color: "#E8EFF8", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
              onClick={closeToast}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false, theme: "dark" },
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <style>{STYLES}</style>

      {/* ── Sidebar ── */}
      <nav
        style={{
          width: 232,
          minHeight: "100vh",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "28px 0",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "0 24px", marginBottom: 36, display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32, height: 32,
              background: "linear-gradient(135deg, var(--lime), var(--cyan))",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "#070B12",
            }}
          >
            IP
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, letterSpacing: "0.12em", color: "var(--text)" }}>
            InterPrep
          </span>
        </div>

        <div style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => {
            const active = item.href === "/dashboard/settings";
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <motion.div
                  whileHover={{ x: 4 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                    fontSize: 13, fontWeight: 500, transition: "background 0.15s",
                    background: active ? "rgba(170,255,60,0.08)" : "transparent",
                    color:      active ? "var(--lime)"            : "var(--muted)",
                    border:     active ? "1px solid rgba(170,255,60,0.15)" : "1px solid transparent",
                  }}
                >
                  <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {active && (
                    <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--lime)" }} />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div style={{ margin: "0 12px", padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--violet), var(--cyan))", marginBottom: 8 }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
            {session?.user?.name ?? "User"}
          </p>
          <p style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis" }}>
            {session?.user?.email ?? ""}
          </p>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "40px 48px", overflowY: "auto" }} className="dot-grid">

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 6 }}>
            Dashboard / <span style={{ color: "var(--lime)" }}>Settings</span>
          </p>
          <h1 style={{ fontFamily: "var(--font-head)", fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 28 }}>
            Your <span style={{ color: "var(--lime)" }}>Settings</span>
          </h1>
        </motion.div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 5, width: "fit-content" }}>
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "9px 20px", borderRadius: 10, cursor: "pointer",
                fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 7,
                fontFamily: "var(--font-body)",
                ...(activeTab === tab.id
                  ? { background: "rgba(170,255,60,0.1)", color: "var(--lime)", border: "1px solid rgba(170,255,60,0.2)" }
                  : { background: "transparent", color: "var(--muted)", border: "1px solid transparent" }
                ),
              }}
            >
              <span style={{ fontSize: 12 }}>{tab.icon}</span>
              {tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="popLayout">

          {/* ── Profile ── */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <SectionLabel text="PERSONAL INFO" />
                <div style={{ marginBottom: 16 }}>
                  <FieldLabel text="Display name" />
                  <input
                    className="input-field"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <FieldLabel text="Target role" />
                    <input
                      className="input-field"
                      placeholder="e.g. Software Engineer"
                      value={form.targetRole}
                      onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
                    />
                  </div>
                  <div>
                    <FieldLabel text="Target companies" />
                    <input
                      className="input-field"
                      placeholder="Google, Meta, Stripe…"
                      value={form.targetCompanies}
                      onChange={(e) => setForm((f) => ({ ...f, targetCompanies: e.target.value }))}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <SectionLabel text="YOUR SKILLS" />
                <FieldLabel text="Skills (comma-separated)" />
                <input
                  className="input-field"
                  placeholder="React, TypeScript, Node.js, Python…"
                  value={form.skills}
                  onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                  style={{ marginBottom: 0 }}
                />
              </Card>

              <Card>
                <SectionLabel text="RESUME" />
                <FieldLabel text="Upload your resume — used to generate personalised questions" />
                <motion.div
                  style={{ background: "var(--surface)", border: "2px dashed var(--border)", borderRadius: 12, padding: 24, cursor: "pointer", marginBottom: 16 }}
                  whileHover={{ borderColor: "rgba(170,255,60,0.5)" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center", pointerEvents: "none" }}>
                    <div style={{ fontSize: 24, color: "var(--lime)" }}>📄</div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>Upload PDF Resume</p>
                      <p style={{ fontSize: 11, color: "var(--muted)" }}>Click or drag your PDF here</p>
                    </div>
                    {uploadingPDF && (
                      <p style={{ fontSize: 11, color: "var(--cyan)" }}>Extracting text…</p>
                    )}
                    {form.resumeText && !uploadingPDF && (
                      <p style={{ fontSize: 11, color: "var(--lime)", marginTop: 8 }}>
                        ✓ Resume loaded ({Math.round(form.resumeText.length / 100)} chars)
                      </p>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handlePDFUpload}
                    disabled={uploadingPDF}
                    style={{ display: "none" }}
                  />
                </motion.div>
                <FieldLabel text="Resume text (or paste manually)" />
                <textarea
                  className="input-field"
                  placeholder="Paste resume content here…"
                  value={form.resumeText}
                  onChange={(e) => setForm((f) => ({ ...f, resumeText: e.target.value }))}
                  autoComplete="off"
                  style={{ minHeight: 160 }}
                />
              </Card>

              <SaveBtn onSave={handleSave} saving={saving} />
            </motion.div>
          )}

          {/* ── Preferences ── */}
          {activeTab === "preferences" && (
            <motion.div
              key="prefs"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <SectionLabel text="EXPERIENCE LEVEL" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {LEVELS.map((l) => (
                    <motion.button
                      key={l}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setForm((f) => ({ ...f, targetLevel: l }))}
                      style={{
                        padding: "11px 0", borderRadius: 10, border: "1px solid",
                        cursor: "pointer", fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                        transition: "all 0.2s", fontFamily: "var(--font-body)",
                        ...(form.targetLevel === l
                          ? { background: "rgba(170,255,60,0.1)", borderColor: "rgba(170,255,60,0.4)", color: "var(--lime)" }
                          : { background: "transparent", borderColor: "var(--border)", color: "var(--muted)" }
                        ),
                      }}
                    >
                      {l}
                    </motion.button>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionLabel text="DEFAULT DIFFICULTY" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {DIFFICULTIES.map((d) => {
                    const col    = DIFF_COLOR[d];
                    const active = form.preferredDifficulty === d;
                    return (
                      <motion.button
                        key={d}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setForm((f) => ({ ...f, preferredDifficulty: d }))}
                        style={{
                          padding: "11px 0", borderRadius: 10, border: "1px solid",
                          cursor: "pointer", fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                          transition: "all 0.2s", fontFamily: "var(--font-body)",
                          ...(active
                            ? { background: `${col}18`, borderColor: `${col}60`, color: col }
                            : { background: "transparent", borderColor: "var(--border)", color: "var(--muted)" }
                          ),
                        }}
                      >
                        {d}
                      </motion.button>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <SectionLabel text="DEFAULT QUESTION COUNT" />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>Questions per session</span>
                  <span style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: "var(--lime)" }}>
                    {form.questionCount}
                  </span>
                </div>
                <input
                  type="range" min={3} max={15} step={1}
                  value={form.questionCount}
                  onChange={(e) => setForm((f) => ({ ...f, questionCount: Number(e.target.value) }))}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", marginTop: 6 }}>
                  <span>3</span><span>15</span>
                </div>
              </Card>

              <SaveBtn onSave={handleSave} saving={saving} />
            </motion.div>
          )}

          {/* ── Plan ── */}
          {activeTab === "plan" && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <SectionLabel text="CURRENT PLAN" />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, marginBottom: 6, color: userData?.plan === "pro" ? "var(--lime)" : "var(--text)" }}>
                      {userData?.plan?.toUpperCase() ?? "FREE"}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--muted)" }}>
                      {userData?.plan === "pro"
                        ? "Unlimited sessions per month."
                        : `${userData?.sessionsUsedThisMonth ?? 0} of ${userData?.monthlyLimit ?? 10} sessions used this month.`}
                    </p>
                  </div>
                  {userData?.plan !== "pro" && (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      style={{ background: "var(--lime)", color: "#070B12", border: "none", borderRadius: 12, padding: "12px 22px", fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                    >
                      ↑ Upgrade to Pro
                    </motion.button>
                  )}
                </div>
                {userData?.plan !== "pro" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                    {["Unlimited sessions", "Priority AI model", "Detailed analytics", "Export reports"].map((feat) => (
                      <div key={feat} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ color: "var(--lime)", fontSize: 12 }}>✓</span>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>{feat}</span>
                        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--violet)", fontFamily: "var(--font-mono)" }}>PRO</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <SectionLabel text="USAGE THIS MONTH" />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>Sessions</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                    <span style={{ color: "var(--coral)" }}>{userData?.sessionsUsedThisMonth ?? 0}</span>
                    <span style={{ color: "var(--muted)" }}> / {userData?.monthlyLimit ?? 10}</span>
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((userData?.sessionsUsedThisMonth ?? 0) / (userData?.monthlyLimit ?? 10)) * 100)}%` }}
                    transition={{ duration: 1 }}
                    style={{ height: "100%", borderRadius: 3, background: "var(--coral)" }}
                  />
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── Account ── */}
          {activeTab === "account" && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <SectionLabel text="ACCOUNT DETAILS" />
                {([
                  ["Email",         session?.user?.email ?? "—"],
                  ["Member since",  userData?.createdAt  ? new Date(userData.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"],
                  ["Last login",    userData?.lastLoginAt ? new Date(userData.lastLoginAt).toLocaleDateString() : "—"],
                  ["Login count",   String(userData?.loginCount ?? 0)],
                  ["Auth provider", userData?.provider ?? "local"],
                ] as [string, string][]).map(([k, v], idx, arr) => (
                  <div
                    key={k}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 0",
                      borderBottom: idx < arr.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{k}</span>
                    <span style={{ fontSize: 13, color: "var(--text)", textTransform: k === "Auth provider" ? "capitalize" : "none" }}>{v}</span>
                  </div>
                ))}
              </Card>

              <div style={{ background: "rgba(255,107,107,0.04)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: 18, padding: 28 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--coral)", letterSpacing: "0.14em", marginBottom: 20 }}>
                  DANGER ZONE
                </p>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20, lineHeight: 1.6 }}>
                  Actions here are permanent and cannot be reversed. Please proceed with caution.
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 22px", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, transition: "all 0.2s" }}
                  >
                    Sign out
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03, borderColor: "rgba(255,107,107,0.6)" }} whileTap={{ scale: 0.97 }}
                    onClick={handleDeleteAccount}
                    style={{ background: "rgba(255,107,107,0.08)", color: "var(--coral)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: 10, padding: "11px 22px", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, transition: "all 0.2s" }}
                  >
                    Delete account
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <ToastContainer position="bottom-right" autoClose={3000} theme="dark" />
    </div>
  );
}