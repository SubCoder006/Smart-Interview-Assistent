"use client";

// app/dashboard/interview/page.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { extractTextFromPDF } from '@/lib/pdfExtract';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const navItems = [
  { href: '/dashboard',           label: 'Overview',  icon: '⬡' },
  { href: '/dashboard/interview', label: 'Interview', icon: '⊙' },
  { href: '/dashboard/history',   label: 'History',   icon: '▤' },
  { href: '/dashboard/settings',  label: 'Settings',  icon: '⊕' },
];

const STYLES = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:       #070B12;
    --surface:  #0C1120;
    --card:     #101825;
    --border:   #1C2B40;
    --border2:  #243248;
    --lime:     #AAFF3C;
    --cyan:     #00E5C3;
    --violet:   #A78BFA;
    --coral:    #FF6B6B;
    --text:     #E8EFF8;
    --muted:    #5A6A85;
    --muted2:   #3A4D66;
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
  input[type=range] { accent-color: var(--lime); width: 100%; }
`;

const LEVELS       = ['junior', 'mid', 'senior', 'lead'] as const;
const DIFFICULTIES = ['easy', 'medium', 'hard']          as const;
const DIFF_COLOR: Record<string, string> = { easy: '#AAFF3C', medium: '#00E5C3', hard: '#FF6B6B' };

interface Form {
  role: string;
  company: string;
  level: typeof LEVELS[number];
  difficulty: typeof DIFFICULTIES[number];
  questionCount: number;
  focusAreas: string;
  resumeText: string;
}

export default function InterviewPage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Form>({
    role: '', company: '', level: 'mid', difficulty: 'medium', questionCount: 5, focusAreas: '', resumeText: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [step, setStep] = useState<'config' | 'starting'>('config');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          setUserData(data.user);
          setForm(f => ({
            ...f,
            role:       data.user.preferences?.targetRole          ?? '',
            level:      (data.user.preferences?.targetLevel        ?? 'mid') as typeof LEVELS[number],
            difficulty: (data.user.preferences?.preferredDifficulty ?? 'medium') as typeof DIFFICULTIES[number],
            questionCount: data.user.preferences?.questionCount    ?? 5,
          }));
        }
      } catch (_) {}
    })();
  }, []);

  const handleStart = useCallback(async () => {
    if (!form.role.trim()) { toast.error('Please enter a target role.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setStep('starting');
        setTimeout(() => { window.location.href = `/dashboard/interview/${data.session._id}`; }, 1200);
      } else {
        toast.error('Failed to start session. Try again.');
      }
    } catch (_) {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [form]);

  const handlePDFUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file.');
      return;
    }

    setUploadingPDF(true);
    try {
      const text = await extractTextFromPDF(file);
      if (!text.trim()) {
        toast.error('Could not extract text from PDF.');
        return;
      }
      setForm(f => ({ ...f, resumeText: text }));
      toast.success(`Resume uploaded! (${Math.round(text.length / 100)} chars)`);
    } catch (err) {
      console.error('PDF extraction error:', err);
      toast.error('Failed to extract PDF text. Try again.');
    } finally {
      setUploadingPDF(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
      <style>{STYLES}</style>

      {/* ── Sidebar ── */}
      <nav style={{
        width: 232, minHeight: '100vh', background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', padding: '28px 0', position: 'sticky',
        top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '0 24px', marginBottom: 36, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'linear-gradient(135deg, var(--lime), var(--cyan))',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#070B12',
          }}>IP</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text)' }}>InterPrep</span>
        </div>
        <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const active = item.href === '/dashboard/interview';
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ x: 4 }} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, transition: 'background 0.15s',
                  background: active ? 'rgba(170,255,60,0.08)' : 'transparent',
                  color: active ? 'var(--lime)' : 'var(--muted)',
                  border: active ? '1px solid rgba(170,255,60,0.15)' : '1px solid transparent',
                }}>
                  <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)' }} />}
                </motion.div>
              </Link>
            );
          })}
        </div>
        <div style={{ margin: '0 12px', padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--violet), var(--cyan))', marginBottom: 8 }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{session?.user?.name ?? 'User'}</p>
          <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session?.user?.email ?? ''}</p>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }} className="dot-grid">
        <AnimatePresence mode="wait">
          {step === 'starting' ? (
            <motion.div
              key="starting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 20 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--lime)' }}
              />
              <p style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Preparing your session…</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>AI is generating your interview questions</p>
            </motion.div>
          ) : (
            <motion.div key="config" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

              {/* Header */}
              <div style={{ marginBottom: 36 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 6 }}>
                  Dashboard / <span style={{ color: 'var(--lime)' }}>Interview</span>
                </p>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  Configure <span style={{ color: 'var(--lime)' }}>Session</span>
                </h1>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>Set up your mock interview — we'll generate questions tailored to your choices.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, maxWidth: 960 }}>

                {/* Left — main config */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Role + Company */}
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 28 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', marginBottom: 20 }}>TARGET ROLE</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>Role *</label>
                        <input
                          className="input-field"
                          placeholder="e.g. Software Engineer"
                          value={form.role}
                          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>Company (optional)</label>
                        <input
                          className="input-field"
                          placeholder="e.g. Google, Stripe…"
                          value={form.company}
                          onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>Focus areas (optional)</label>
                      <input
                        className="input-field"
                        placeholder="e.g. system design, React, leadership…"
                        value={form.focusAreas}
                        onChange={e => setForm(f => ({ ...f, focusAreas: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* PDF Upload */}
                  <motion.div
                    layout={false}
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, cursor: 'pointer', pointerEvents: 'auto' }}
                    whileHover={{ borderColor: 'rgba(170,255,60,0.5)' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', marginBottom: 14, pointerEvents: 'none' }}>RESUME</p>
                    <div style={{
                      border: '2px dashed var(--border)', borderRadius: 12, padding: 24,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 10, textAlign: 'center', transition: 'all 0.2s', pointerEvents: 'none',
                    }}>
                      <div style={{ fontSize: 28, color: 'var(--lime)' }}>📄</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Upload PDF Resume</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)' }}>Click or drag your PDF here</p>
                      </div>
                      {uploadingPDF && <p style={{ fontSize: 11, color: 'var(--cyan)' }}>Extracting text…</p>}
                      {form.resumeText && (
                        <p style={{ fontSize: 11, color: 'var(--lime)', marginTop: 8 }}>
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
                      style={{ display: 'none' }}
                    />
                  </motion.div>

                  {/* Level */}
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 28 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', marginBottom: 16 }}>EXPERIENCE LEVEL</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {LEVELS.map(l => (
                        <motion.button
                          key={l}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setForm(f => ({ ...f, level: l }))}
                          style={{
                            padding: '11px 0', borderRadius: 10, border: '1px solid',
                            cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                            transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                            ...(form.level === l
                              ? { background: 'rgba(170,255,60,0.1)', borderColor: 'rgba(170,255,60,0.4)', color: 'var(--lime)' }
                              : { background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted)' }
                            ),
                          }}
                        >{l}</motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 28 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', marginBottom: 16 }}>DIFFICULTY</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {DIFFICULTIES.map(d => {
                        const col = DIFF_COLOR[d];
                        const active = form.difficulty === d;
                        return (
                          <motion.button
                            key={d}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                            style={{
                              padding: '11px 0', borderRadius: 10, border: `1px solid`,
                              cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                              transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                              ...(active
                                ? { background: `${col}18`, borderColor: `${col}60`, color: col }
                                : { background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted)' }
                              ),
                            }}
                          >{d}</motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right — summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Question count */}
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', marginBottom: 16 }}>QUESTION COUNT</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Questions</span>
                      <span style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, color: 'var(--lime)' }}>{form.questionCount}</span>
                    </div>
                    <input
                      type="range" min={3} max={15} step={1}
                      value={form.questionCount}
                      onChange={e => setForm(f => ({ ...f, questionCount: Number(e.target.value) }))}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
                      <span>3 min</span><span>15 max</span>
                    </div>
                  </div>

                  {/* Summary card */}
                  <div style={{ background: 'linear-gradient(135deg, rgba(170,255,60,0.06), rgba(0,229,195,0.04))', border: '1px solid rgba(170,255,60,0.18)', borderRadius: 18, padding: 24 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--lime)', letterSpacing: '0.14em', marginBottom: 16 }}>SESSION SUMMARY</p>
                    {[
                      ['Role',        form.role || '—'],
                      ['Company',     form.company || 'Any'],
                      ['Level',       form.level],
                      ['Difficulty',  form.difficulty],
                      ['Questions',   String(form.questionCount)],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{k}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize', fontFamily: 'var(--font-mono)' }}>{v}</span>
                      </div>
                    ))}
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 14, lineHeight: 1.6 }}>
                      Est. {Math.round(form.questionCount * 3.5)} – {Math.round(form.questionCount * 5)} min
                    </p>
                  </div>

                  {/* Start button */}
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(170,255,60,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStart}
                    disabled={loading}
                    style={{
                      background: loading ? 'var(--border)' : 'var(--lime)',
                      color: loading ? 'var(--muted)' : '#070B12',
                      border: 'none', borderRadius: 12, padding: '16px',
                      fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
                      transition: 'all 0.2s',
                    }}
                  >
                    {loading ? 'Creating session…' : '→ Start Interview'}
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