"use client";

// app/dashboard/page.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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
  .glow-lime { box-shadow: 0 0 32px rgba(170,255,60,0.12); }
  .glow-cyan { box-shadow: 0 0 32px rgba(0,229,195,0.1); }
  .card-hover { transition: border-color 0.2s, transform 0.2s; }
  .card-hover:hover { border-color: var(--border2); transform: translateY(-2px); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
`;

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};
const fadeUpTransition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

interface Stats {
  totalSessions: number;
  avgScore: number;
  bestScore: number;
  streak: number;
}

interface RecentSession {
  _id: string;
  sessionCode: string;
  role: string;
  level: string;
  overallScore: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    (async () => {
      try {
        const [sRes, rRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/sessions?limit=5'),
        ]);
        if (sRes.ok) setStats((await sRes.json()).stats);
        if (rRes.ok) setRecent((await rRes.json()).sessions ?? []);
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  const scoreColor = (s: number) =>
    s >= 70 ? 'var(--lime)' : s >= 40 ? 'var(--cyan)' : 'var(--coral)';

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
        {/* Logo */}
        <div style={{ padding: '0 24px', marginBottom: 36, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'linear-gradient(135deg, var(--lime), var(--cyan))',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#070B12',
          }}>IP</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text)' }}>
            InterPrep
          </span>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const active = item.href === '/dashboard';
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ x: 4 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, transition: 'background 0.15s',
                    background: active ? 'rgba(170,255,60,0.08)' : 'transparent',
                    color: active ? 'var(--lime)' : 'var(--muted)',
                    border: active ? '1px solid rgba(170,255,60,0.15)' : '1px solid transparent',
                  }}
                >
                  <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)' }} />}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* User */}
        <div style={{ margin: '0 12px', padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--violet), var(--cyan))', marginBottom: 8 }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{session?.user?.name ?? 'User'}</p>
          <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{session?.user?.email ?? ''}</p>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto', background: 'var(--bg)' }} className="dot-grid">
        <motion.div variants={stagger} initial="initial" animate="animate">

          {/* Header */}
          <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 6 }}>
                {greeting}, {firstName} 👋
              </p>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Your Interview{' '}
                <span style={{ color: 'var(--lime)' }}>Dashboard</span>
              </h1>
            </div>
            <Link href="/dashboard/interview" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(170,255,60,0.35)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: 'var(--lime)', color: '#070B12', border: 'none',
                  borderRadius: 12, padding: '12px 24px', fontFamily: 'var(--font-body)',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 8,
                }}
              >
                + New Interview
              </motion.button>
            </Link>
          </motion.div>

          {/* Hero Banner */}
          <motion.div
            variants={fadeUp}
            style={{
              background: 'linear-gradient(135deg, rgba(170,255,60,0.06) 0%, rgba(0,229,195,0.04) 100%)',
              border: '1px solid rgba(170,255,60,0.15)', borderRadius: 20,
              padding: '32px 36px', marginBottom: 32, display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', gap: 32,
              flexWrap: 'wrap',
            }}
            className="glow-lime"
          >
            <div style={{ flex: '1 1 380px', maxWidth: 580 }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em',
                color: 'var(--lime)', marginBottom: 12, textTransform: 'uppercase',
              }}>
                AI-Powered Mock Interviews
              </p>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 12 }}>
                Land your dream role with practice that actually works.
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                InterPrep generates tailored questions from your resume and target role, then gives instant AI feedback — scoring answers, pointing out gaps, and suggesting model responses.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: '0 0 auto' }}>
              {['Resume-aware questions', 'Instant AI feedback', 'Score tracking', 'Multiple difficulty levels'].map(f => (
                <div key={f} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 16px', fontSize: 13, color: 'var(--text)',
                }}>
                  <span style={{ color: 'var(--lime)', fontSize: 11 }}>✓</span> {f}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Interviews', value: stats?.totalSessions, sub: 'sessions completed', dot: 'var(--lime)' },
              { label: 'Avg Score',        value: stats?.avgScore ? `${stats.avgScore}%` : '—', sub: 'across all sessions', dot: 'var(--cyan)' },
              { label: 'Best Score',       value: stats?.bestScore ? `${stats.bestScore}%` : '—', sub: 'personal record', dot: 'var(--coral)' },
              { label: 'Current Streak',   value: stats?.streak ?? 0, sub: 'days in a row', dot: 'var(--violet)' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="card-hover"
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: '24px', cursor: 'default',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, marginBottom: 16, boxShadow: `0 0 8px ${s.dot}80` }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 8 }}>
                  {s.label}
                </p>
                <p style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                  {loading ? <span style={{ display: 'inline-block', width: 40, height: 4, background: 'var(--border)', borderRadius: 2 }} /> : (s.value ?? '—')}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted2)' }}>{s.sub}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Workspace */}
          <motion.div variants={fadeUp}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--muted)', marginBottom: 20, textTransform: 'uppercase' }}>
              Workspace
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { title: 'Start Practice', desc: 'Begin a new AI-powered mock interview session tailored to your role.', action: '/dashboard/interview', cta: '→ Start', color: 'var(--lime)' },
                { title: 'View History',   desc: 'Review past sessions, scores, and detailed performance breakdowns.', action: '/dashboard/history',   cta: '→ Browse', color: 'var(--cyan)' },
                { title: 'Your Settings',  desc: 'Update your profile, resume, target role, and interview preferences.', action: '/dashboard/settings',  cta: '→ Configure', color: 'var(--violet)' },
              ].map(card => (
                <Link key={card.title} href={card.action} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ y: -4, borderColor: card.color + '44' }}
                    style={{
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 16, padding: '24px', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{card.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>{card.desc}</p>
                    <span style={{ fontSize: 13, fontWeight: 600, color: card.color }}>{card.cta}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent sessions */}
          {recent.length > 0 && (
            <motion.div variants={fadeUp}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--muted)', textTransform: 'uppercase' }}>Recent Sessions</p>
                <Link href="/dashboard/history" style={{ textDecoration: 'none', fontSize: 12, color: 'var(--lime)', fontWeight: 600 }}>View all →</Link>
              </div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 0, padding: '10px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em' }}>
                  <span>SESSION</span><span>STATUS</span><span style={{ textAlign: 'center' }}>SCORE</span><span style={{ textAlign: 'right' }}>DATE</span>
                </div>
                {recent.map((s, i) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', cursor: 'default', transition: 'background 0.15s' }}
                  >
                    <div>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{s.sessionCode}</p>
                      <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{s.role} · {s.level}</p>
                    </div>
                    <span style={{
                      fontSize: 10, fontFamily: 'var(--font-mono)', padding: '3px 8px',
                      borderRadius: 6, display: 'inline-block', textTransform: 'capitalize',
                      background: s.status === 'completed' ? 'rgba(170,255,60,0.1)' : s.status === 'in_progress' ? 'rgba(0,229,195,0.1)' : 'rgba(90,106,133,0.15)',
                      color: s.status === 'completed' ? 'var(--lime)' : s.status === 'in_progress' ? 'var(--cyan)' : 'var(--muted)',
                      border: `1px solid ${s.status === 'completed' ? 'rgba(170,255,60,0.2)' : s.status === 'in_progress' ? 'rgba(0,229,195,0.2)' : 'var(--border)'}`,
                    }}>{s.status.replace('_', ' ')}</span>
                    <span style={{ textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800, color: scoreColor(s.overallScore) }}>
                      {s.overallScore ? `${s.overallScore}%` : '—'}
                    </span>
                    <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                      {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </motion.div>
      </main>
    </div>
  );
}