"use client";

// app/dashboard/history/page.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
`;

interface Session {
  _id: string;
  sessionCode: string;
  status: 'created' | 'in_progress' | 'completed' | 'abandoned';
  role: string;
  company?: string;
  level: string;
  overallScore: number;
  technicalScore: number;
  behavioralScore: number;
  completionRate: number;
  createdAt: string;
  completedAt?: string;
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  completed:   { color: '#AAFF3C', label: 'Completed' },
  in_progress: { color: '#00E5C3', label: 'In Progress' },
  created:     { color: '#A78BFA', label: 'Created' },
  abandoned:   { color: '#5A6A85', label: 'Abandoned' },
};

const FILTERS = ['all', 'completed', 'in_progress', 'abandoned'] as const;

export default function HistoryPage() {
  const { data: session } = useSession();
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<typeof FILTERS[number]>('all');
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [sortBy, setSortBy]       = useState<'date' | 'score'>('date');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) setSessions((await res.json()).sessions ?? []);
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = sessions
    .filter(s => filter === 'all' || s.status === filter)
    .sort((a, b) =>
      sortBy === 'date'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : b.overallScore - a.overallScore
    );

  const scoreColor = (score: number) =>
    score >= 70 ? 'var(--lime)' : score >= 40 ? 'var(--cyan)' : 'var(--coral)';

  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const avgScore = sessions.filter(s => s.overallScore).reduce((a, b, _, arr) => a + b.overallScore / arr.length, 0);

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
            const active = item.href === '/dashboard/history';
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

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 6 }}>
            Dashboard / <span style={{ color: 'var(--lime)' }}>History</span>
          </p>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 28 }}>
            Session <span style={{ color: 'var(--lime)' }}>History</span>
          </h1>
        </motion.div>

        {/* Quick stats row */}
        {!loading && sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}
          >
            {[
              { label: 'Total Sessions',    value: sessions.length, color: 'var(--lime)' },
              { label: 'Completed',         value: completedCount,  color: 'var(--cyan)' },
              { label: 'Avg Score',         value: sessions.some(s => s.overallScore) ? `${Math.round(avgScore)}%` : '—', color: 'var(--violet)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 22px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}
        >
          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                  textTransform: 'capitalize', transition: 'all 0.2s',
                  ...(filter === f
                    ? { background: 'rgba(170,255,60,0.1)', border: '1px solid rgba(170,255,60,0.3)', color: 'var(--lime)' }
                    : { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }
                  ),
                }}
              >{f.replace('_', ' ')}</motion.button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>SORT BY</span>
            {(['date', 'score'] as const).map(s => (
              <motion.button
                key={s}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSortBy(s)}
                style={{
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'capitalize',
                  transition: 'all 0.2s',
                  ...(sortBy === s
                    ? { background: 'transparent', border: '1px solid rgba(170,255,60,0.3)', color: 'var(--lime)' }
                    : { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }
                  ),
                }}
              >{s}</motion.button>
            ))}
          </div>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--lime)' }}
            />
          </div>

        ) : filtered.length === 0 ? (
          /* Empty state */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>▤</div>
            <p style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginTop: 8 }}>No sessions found</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              {filter === 'all' ? "You haven't completed any interviews yet." : `No ${filter.replace('_', ' ')} sessions.`}
            </p>
            <Link href="/dashboard/interview" style={{ textDecoration: 'none', marginTop: 8 }}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                style={{ background: 'var(--lime)', color: '#070B12', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}
              >→ Start Interview</motion.button>
            </Link>
          </motion.div>

        ) : (
          /* Session list */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>

            {/* Table head */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 120px 100px 120px 100px',
              padding: '12px 24px', borderBottom: '1px solid var(--border)',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em',
            }}>
              <span>SESSION</span>
              <span>STATUS</span>
              <span style={{ textAlign: 'center' }}>SCORE</span>
              <span style={{ textAlign: 'center' }}>COMPLETION</span>
              <span style={{ textAlign: 'right' }}>DATE</span>
            </div>

            <AnimatePresence>
              {filtered.map((s, i) => {
                const meta = STATUS_META[s.status] ?? STATUS_META.abandoned;
                const isExpanded = expanded === s._id;
                return (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    {/* Row */}
                    <motion.div
                      whileHover={{ background: 'rgba(255,255,255,0.025)' }}
                      onClick={() => setExpanded(isExpanded ? null : s._id)}
                      style={{
                        display: 'grid', gridTemplateColumns: '2fr 120px 100px 120px 100px',
                        padding: '16px 24px', cursor: 'pointer', alignItems: 'center',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Session info */}
                      <div>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{s.sessionCode}</p>
                        <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
                          {s.role} · {s.level}{s.company ? ` · ${s.company}` : ''}
                        </p>
                      </div>

                      {/* Status */}
                      <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)', padding: '4px 10px',
                        borderRadius: 6, display: 'inline-block', textTransform: 'capitalize',
                        background: `${meta.color}18`, color: meta.color,
                        border: `1px solid ${meta.color}30`, whiteSpace: 'nowrap',
                      }}>{meta.label}</span>

                      {/* Score */}
                      <span style={{ textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: scoreColor(s.overallScore) }}>
                        {s.overallScore ? `${s.overallScore}%` : '—'}
                      </span>

                      {/* Completion bar */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.completionRate}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.04 }}
                            style={{ height: '100%', borderRadius: 2, background: meta.color }}
                          />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{s.completionRate}%</span>
                      </div>

                      {/* Date */}
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                          {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
                          {isExpanded ? '▲ hide' : '▼ details'}
                        </p>
                      </div>
                    </motion.div>

                    {/* Expanded panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                            borderTop: '1px solid var(--border)',
                            background: 'rgba(255,255,255,0.015)',
                          }}>
                            {[
                              { label: 'Technical Score',  value: s.technicalScore  ? `${s.technicalScore}%`  : '—', color: 'var(--cyan)' },
                              { label: 'Behavioral Score', value: s.behavioralScore ? `${s.behavioralScore}%` : '—', color: 'var(--violet)' },
                              { label: 'Overall Score',    value: s.overallScore    ? `${s.overallScore}%`    : '—', color: 'var(--lime)' },
                              { label: 'Completed',        value: s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—', color: 'var(--text)' },
                            ].map((item, idx) => (
                              <div key={item.label} style={{
                                padding: '18px 24px',
                                borderRight: idx < 3 ? '1px solid var(--border)' : 'none',
                              }}>
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 8 }}>{item.label}</p>
                                <p style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</p>
                              </div>
                            ))}
                          </div>
                          {/* PDF Download Button */}
                          {s.status === 'completed' && (
                            <div style={{ padding: '18px 24px', borderTop: '1px solid var(--border)', background: 'rgba(170,255,60,0.03)' }}>
                              <button
                                style={{
                                  background: 'var(--lime)', color: '#070B12', border: 'none', borderRadius: 8,
                                  padding: '10px 22px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15
                                }}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const res = await fetch(`/api/session/${s._id}/pdf?sessionId=${s._id}`);
                                  if (res.ok) {
                                    const { url } = await res.json();
                                    window.open(url, '_blank');
                                  } else {
                                    alert('Failed to generate/download PDF.');
                                  }
                                }}
                              >Download PDF</button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <ToastContainer position="bottom-right" autoClose={3000} theme="dark" />
    </div>
  );
}