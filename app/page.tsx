"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "📄",
    title: "Resume-Based Question Generation",
    description:
      "Upload your resume and receive tailored interview questions aligned with your experience and target role.",
    tag: "Smart Parsing",
  },
  {
    icon: "🤖",
    title: "AI-Powered Feedback",
    description:
      "Get instant analysis on clarity, keyword density, and actionable improvement suggestions after every answer.",
    tag: "Real-time Analysis",
  },
  {
    icon: "🎯",
    title: "Weakness Detection",
    description:
      "AI identifies gaps in your answers and flags areas to strengthen your communication or technical depth.",
    tag: "Gap Analysis",
  },
  {
    icon: "📊",
    title: "Progress Tracking Dashboard",
    description:
      "Visualize your improvement over sessions with charts, streaks, and performance metrics across all roles.",
    tag: "Analytics",
  },
  {
    icon: "💬",
    title: "Follow-up Questions",
    description:
      "Experience real interview dynamics with AI that asks intelligent follow-ups based on your previous answers.",
    tag: "Conversational AI",
  },
];

const STEPS = [
  {
    number: "01",
    icon: "⬆️",
    title: "Upload Resume or Enter Role",
    description:
      "Paste your resume or specify the job role. Our AI builds a personalized question bank in seconds.",
  },
  {
    number: "02",
    icon: "🎤",
    title: "Practice Interview Questions",
    description:
      "Answer role-specific questions in a distraction-free environment that simulates the real interview.",
  },
  {
    number: "03",
    icon: "⚡",
    title: "Get Instant AI Feedback",
    description:
      "Receive detailed feedback on every answer — what worked, what didn't, and exactly how to improve.",
  },
];

const STATS = [
  { value: "5K+", label: "Active Users",        icon: "👥" },
  { value: "10K+", label: "Questions Practiced", icon: "📝" },
  { value: "90%",  label: "AI Accuracy",          icon: "🎯" },
  { value: "4.3★", label: "Student Rating",       icon: "⭐" },
];

const METRICS = [
  { label: "Clarity",     value: "78%", color: "#3b82f6" },
  { label: "Keywords",   value: "91%", color: "#a855f7" },
  { label: "Confidence", value: "65%", color: "#06b6d4" },
];

const PILLARS = [
  { text: "Personalized Practice",  color: "#3b82f6" },
  { text: "Real-time Feedback",     color: "#a855f7" },
  { text: "Continuous Improvement", color: "#06b6d4" },
];

const FOOTER_LINKS = [
  { text: "Home", href: "#" },
  { text: "About", href: "#about" },
  { text: "LinkedIn", href: "https://www.linkedin.com/in/subayan-ghosh-5a3835319" },
  { text: "Features", href: "#features" },
  { text: "Get Started", href: "/auth/signup" }
]

// ═════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function Home() {
  const router = useRouter();
  // ── Typing effect ──────────────────────────────────────────────────────────
  const FULL_TEXT = "Crack Interviews with AI Precision";
  const [typed, setTyped]          = useState("");
  const [activeFeature, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(FULL_TEXT.slice(0, i));
      if (i >= FULL_TEXT.length) clearInterval(id);
    }, 48);
    return () => clearInterval(id);
  }, []);

  // ── Auto-advance carousel ──────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setActive(p => (p + 1) % FEATURES.length), 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    const cardW = 320; // card width + gap
    scrollRef.current.scrollTo({ left: activeFeature * cardW, behavior: "smooth" });
  }, [activeFeature]);

  return (
    <main style={{ fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)" }}>

      {/* ── Global styles ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes floatY {
          0%,100% { transform:translateY(0px); }
          50%      { transform:translateY(-10px); }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:.3} }

        .float-1 { animation: floatY 4.0s ease-in-out infinite; }
        .float-2 { animation: floatY 4.8s ease-in-out infinite 0.7s; }
        .float-3 { animation: floatY 5.3s ease-in-out infinite 1.3s; }
        .float-4 { animation: floatY 4.5s ease-in-out infinite 2.0s; }
        .blink-cursor { animation: blink 1s step-end infinite; }
        .pulse-dot { animation: pulseDot 2s ease-in-out infinite; }

        .hide-scrollbar::-webkit-scrollbar { display:none; }
        .hide-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }

        .card-hover {
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }
        .card-hover:hover {
          transform: translateY(-5px) scale(1.025);
          box-shadow: 0 0 32px rgba(99,102,241,.2);
          border-color: rgba(99,102,241,.4) !important;
        }
        .stat-card { transition: transform .2s ease, box-shadow .2s ease; }
        .stat-card:hover {
          transform: scale(1.06);
          box-shadow: 0 0 28px rgba(99,102,241,.28);
        }
        .btn-primary {
          background: linear-gradient(135deg,#2563eb,#7c3aed);
          transition: opacity .2s, transform .15s, box-shadow .2s;
          border: none;
        }
        .btn-primary:hover {
          opacity:.88; transform:scale(1.03);
          box-shadow:0 0 30px rgba(99,102,241,.55);
        }
        .btn-secondary {
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.05);
          transition: background .2s, border-color .2s, transform .15s;
        }
        .btn-secondary:hover {
          background:rgba(255,255,255,.10);
          border-color:rgba(255,255,255,.28);
          transform:scale(1.02);
        }
        .nav-link {
          color:rgba(255,255,255,.44); font-size:13px;
          text-decoration:none; transition:color .2s;
        }
        .nav-link:hover { color:#fff; }
        .footer-link {
          font-size:12px; color:rgba(255,255,255,.32);
          text-decoration:none; transition:color .2s;
        }
        .footer-link:hover { color:rgba(255,255,255,.7); }
        section { scroll-margin-top:72px; }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════════════════════ */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:50,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 2.5rem", height:64,
        borderBottom:"1px solid rgba(255,255,255,.07)",
        background:"rgba(10,10,10,.86)", backdropFilter:"blur(18px)",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{
            width:30, height:30, borderRadius:8,
            background:"linear-gradient(135deg,#2563eb,#7c3aed)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:11, fontWeight:700, color:"#fff",
            fontFamily:"var(--font-syne,'Syne',sans-serif)",
          }}>IP</div>
          <span style={{
            fontFamily:"var(--font-syne,'Syne',sans-serif)",
            fontWeight:600, fontSize:14, color:"#fff",
          }}>InterPrep</span>
        </div>

        {/* Nav links */}
        <div style={{ display:"flex", gap:32 }} className="hidden md:flex">
          {["Features","How It Works","About"].map(l => (
            <a key={l} className="nav-link"
              href={`#${l.toLowerCase().replace(/ /g,"-")}`}>{l}</a>
          ))}
        </div>

        {/* Auth */}
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button className="btn-secondary" style={{
            padding:"8px 18px", borderRadius:10,
            fontSize:13, color:"rgba(255,255,255,.7)", cursor:"pointer",
          }} onClick={() => router.push('/auth/signin')}>Sign In</button>
          <button className="btn-primary" style={{
            padding:"8px 18px", borderRadius:10,
            fontSize:13, fontWeight:600, color:"#fff", cursor:"pointer",
          }} onClick={() => router.push('/auth/signup')}>Get Started</button>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ════════════════════════════════════════════════════════════════════ */}
      <section id="hero" style={{
        position:"relative", minHeight:"100vh",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"100px 1.5rem 64px", textAlign:"center", overflow:"hidden",
      }}>
        {/* Ambient glow */}
        <div style={{
          position:"absolute", top:"38%", left:"50%",
          transform:"translate(-50%,-50%)", width:640, height:440,
          borderRadius:"50%",
          background:"radial-gradient(ellipse,rgba(37,99,235,.18) 0%,transparent 70%)",
          pointerEvents:"none",
        }} />
        <div style={{
          position:"absolute", top:"38%", left:"50%",
          transform:"translate(-50%,-50%)", width:380, height:280,
          borderRadius:"50%",
          background:"radial-gradient(ellipse,rgba(124,58,237,.14) 0%,transparent 70%)",
          pointerEvents:"none",
        }} />

        {/* ── Floating Stat Card 1 — top-left ─────────────────────────── */}
        <div className="float-1 stat-card hidden md:flex" style={{
          position:"absolute", top:"18%", left:"3%",
          flexDirection:"column", gap:4,
          padding:"12px 16px", borderRadius:16,
          background:"rgba(255,255,255,.05)", backdropFilter:"blur(14px)",
          border:"1px solid rgba(255,255,255,.10)",
          boxShadow:"0 0 20px rgba(37,99,235,.12)", cursor:"default",
          width:140,
          textAlign:"center",
        }}>
          <span style={{ fontSize:20 }}>👥</span>
          <span style={{
            fontFamily:"var(--font-syne,'Syne',sans-serif)",
            fontWeight:700, fontSize:20, color:"#fff", lineHeight:1.1,
          }}>5K+</span>
          <span style={{ fontSize:11, color:"rgba(255,255,255,.45)", whiteSpace:"nowrap" }}>
            Active Users
          </span>
        </div>

        {/* ── Floating Stat Card 2 — top-right ────────────────────────── */}
        <div className="float-2 stat-card hidden lg:flex" style={{
          position:"absolute", top:"14%", right:"3%",
          flexDirection:"column", gap:4,
          padding:"12px 16px", borderRadius:16,
          background:"rgba(255,255,255,.05)", backdropFilter:"blur(14px)",
          border:"1px solid rgba(255,255,255,.10)",
          boxShadow:"0 0 20px rgba(124,58,237,.12)", cursor:"default",
          width:140,
          textAlign:"center",
        }}>
          <span style={{ fontSize:20 }}>🎯</span>
          <span style={{
            fontFamily:"var(--font-syne,'Syne',sans-serif)",
            fontWeight:700, fontSize:20, color:"#fff", lineHeight:1.1,
          }}>90%</span>
          <span style={{ fontSize:11, color:"rgba(255,255,255,.45)", whiteSpace:"nowrap" }}>
            AI Feedback Accuracy
          </span>
        </div>

        {/* ── Floating Stat Card 3 — bottom-left ──────────────────────── */}
        <div className="float-3 stat-card hidden md:flex" style={{
          position:"absolute", bottom:"24%", left:"4%",
          flexDirection:"column", gap:4,
          padding:"12px 16px", borderRadius:16,
          background:"rgba(255,255,255,.05)", backdropFilter:"blur(14px)",
          border:"1px solid rgba(255,255,255,.10)",
          boxShadow:"0 0 20px rgba(6,182,212,.10)", cursor:"default",
          width:140,
          textAlign:"center",
        }}>
          <span style={{ fontSize:20 }}>📝</span>
          <span style={{
            fontFamily:"var(--font-syne,'Syne',sans-serif)",
            fontWeight:700, fontSize:20, color:"#fff", lineHeight:1.1,
          }}>10K+</span>
          <span style={{ fontSize:11, color:"rgba(255,255,255,.45)", whiteSpace:"nowrap" }}>
            Questions Practiced
          </span>
        </div>

        {/* ── Floating Stat Card 4 — bottom-right ─────────────────────── */}
        <div className="float-4 stat-card hidden lg:flex" style={{
          position:"absolute", bottom:"22%", right:"3.5%",
          flexDirection:"column", gap:4,
          padding:"12px 16px", borderRadius:16,
          background:"rgba(255,255,255,.05)", backdropFilter:"blur(14px)",
          border:"1px solid rgba(255,255,255,.10)",
          boxShadow:"0 0 20px rgba(168,85,247,.10)", cursor:"default",
          width:140,
          textAlign:"center",
        }}>
          <span style={{ fontSize:20 }}>⭐</span>
          <span style={{
            fontFamily:"var(--font-syne,'Syne',sans-serif)",
            fontWeight:700, fontSize:20, color:"#fff", lineHeight:1.1,
          }}>4.3★</span>
          <span style={{ fontSize:11, color:"rgba(255,255,255,.45)", whiteSpace:"nowrap" }}>
            Top Rated by Students
          </span>
        </div>

        {/* ── Hero content ──────────────────────────────────────────────── */}

        {/* Badge */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          padding:"6px 14px", borderRadius:999,
          border:"1px solid rgba(59,130,246,.30)",
          background:"rgba(59,130,246,.10)",
          color:"#93c5fd", fontSize:12, fontWeight:500,
          letterSpacing:"0.04em", marginBottom:24,
        }}>
          <span className="pulse-dot" style={{
            display:"inline-block", width:7, height:7,
            borderRadius:"50%", background:"#60a5fa",
          }} />
          AI-Powered Interview Training
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily:"var(--font-syne,'Syne',sans-serif)",
          fontWeight:700,
          fontSize:"clamp(2rem,5.5vw,4.25rem)",
          lineHeight:1.08, letterSpacing:"-0.02em",
          background:"linear-gradient(160deg,#fff 55%,rgba(255,255,255,.6))",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          maxWidth:780, marginBottom:22,
        }}>
          {typed}
          <span className="blink-cursor" style={{
            display:"inline-block", width:3, height:"0.8em",
            background:"#60a5fa", marginLeft:4, verticalAlign:"middle",
          }} />
        </h1>

        {/* Subheading */}
        <p style={{
          color:"rgba(255,255,255,.48)",
          fontSize:"clamp(0.95rem,2vw,1.1rem)",
          lineHeight:1.75, maxWidth:520, marginBottom:36,
        }}>
          Generate role-specific questions, practice in real-time, and get intelligent
          feedback — so you walk into every interview ready.
        </p>

        {/* CTA buttons */}
        <div style={{
          display:"flex", gap:12, flexWrap:"wrap",
          justifyContent:"center", marginBottom:56,
        }}>
          <button className="btn-primary" style={{
            padding:"13px 28px", borderRadius:12,
            fontSize:14, fontWeight:600, color:"#fff", cursor:"pointer",
            boxShadow:"0 0 22px rgba(99,102,241,.40)",
          }} onClick={() => router.push('/auth/signup')}>
            Get Started — It&apos;s Free &nbsp;→
          </button>
          <button className="btn-secondary" style={{
            padding:"13px 28px", borderRadius:12,
            fontSize:14, color:"rgba(255,255,255,.72)", cursor:"pointer",
          }} onClick={() => router.push('/auth/signin')}>
            Sign In
          </button>
        </div>

        {/* ── Mock Dashboard Card ──────────────────────────────────────── */}
        <div style={{
          position:"relative", width:"100%", maxWidth:700,
          borderRadius:20, overflow:"hidden",
          border:"1px solid rgba(255,255,255,.10)",
          background:"rgba(255,255,255,.03)", backdropFilter:"blur(8px)",
          boxShadow:"0 32px 80px rgba(0,0,0,.55)",
        }}>
          {/* Window chrome */}
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            padding:"10px 16px",
            borderBottom:"1px solid rgba(255,255,255,.07)",
            background:"rgba(255,255,255,.02)",
          }}>
            <div style={{ display:"flex", gap:6 }}>
              {["#ef4444","#f59e0b","#22c55e"].map(c => (
                <div key={c} style={{
                  width:10, height:10, borderRadius:"50%",
                  background:c, opacity:.6,
                }} />
              ))}
            </div>
            <div style={{
              flex:1, height:20, borderRadius:6,
              background:"rgba(255,255,255,.06)",
              display:"flex", alignItems:"center",
              padding:"0 12px", marginLeft:8,
            }}>
              <span style={{
                fontSize:10, color:"rgba(255,255,255,.22)", fontFamily:"monospace",
              }}>InterPrep.app/practice</span>
            </div>
          </div>

          {/* Dashboard body */}
          <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>

            {/* Top bar mock */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ height:10, width:130, borderRadius:6, background:"rgba(255,255,255,.15)" }} />
                <div style={{ height:7,  width:80,  borderRadius:6, background:"rgba(255,255,255,.08)" }} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{
                  height:28, width:88, borderRadius:8,
                  background:"rgba(37,99,235,.35)",
                  border:"1px solid rgba(59,130,246,.3)",
                }} />
                <div style={{
                  height:28, width:28, borderRadius:8,
                  background:"rgba(255,255,255,.07)",
                  border:"1px solid rgba(255,255,255,.10)",
                }} />
              </div>
            </div>

            {/* Question block */}
            <div style={{
              borderRadius:14, border:"1px solid rgba(255,255,255,.08)",
              background:"rgba(255,255,255,.03)", padding:16,
              display:"flex", flexDirection:"column", gap:12,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span className="pulse-dot" style={{
                  display:"inline-block", width:7, height:7,
                  borderRadius:"50%", background:"#60a5fa",
                }} />
                <div style={{ height:7, width:70, borderRadius:4, background:"rgba(96,165,250,.35)" }} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                <div style={{ height:10, width:"100%", borderRadius:5, background:"rgba(255,255,255,.12)" }} />
                <div style={{ height:10, width:"78%",  borderRadius:5, background:"rgba(255,255,255,.08)" }} />
                <div style={{ height:10, width:"55%",  borderRadius:5, background:"rgba(255,255,255,.06)" }} />
              </div>
              <div style={{
                borderRadius:10, border:"1px solid rgba(255,255,255,.08)",
                background:"rgba(255,255,255,.03)", padding:12,
                display:"flex", flexDirection:"column", gap:6,
              }}>
                <div style={{ height:8, width:"92%", borderRadius:4, background:"rgba(255,255,255,.09)" }} />
                <div style={{ height:8, width:"68%", borderRadius:4, background:"rgba(255,255,255,.06)" }} />
              </div>
            </div>

            {/* Metric bars */}
            <div style={{ display:"flex", gap:12 }}>
              {METRICS.map(m => (
                <div key={m.label} style={{
                  flex:1, borderRadius:12,
                  border:"1px solid rgba(255,255,255,.08)",
                  background:"rgba(255,255,255,.03)", padding:12,
                  display:"flex", flexDirection:"column", gap:8,
                }}>
                  <div style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                  }}>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,.55)", fontWeight:500 }}>
                      {m.label}
                    </span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontFamily:"monospace" }}>
                      {m.value}
                    </span>
                  </div>
                  <div style={{
                    height:5, borderRadius:999, background:"rgba(255,255,255,.08)", overflow:"hidden",
                  }}>
                    <div style={{
                      height:"100%", borderRadius:999,
                      background:m.color, width:m.value, opacity:.8,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — STATS ROW
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding:"44px 1.5rem",
        borderTop:"1px solid rgba(255,255,255,.06)",
        borderBottom:"1px solid rgba(255,255,255,.06)",
      }}>
        <div style={{
          maxWidth:900, margin:"0 auto",
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",
          gap:16,
        }}>
          {STATS.map(s => (
            <div key={s.label} className="stat-card" style={{
              display:"flex", flexDirection:"column",
              alignItems:"center", gap:6,
              padding:"22px 16px", borderRadius:16, cursor:"default",
              border:"1px solid rgba(255,255,255,.07)",
              background:"rgba(255,255,255,.03)",
            }}>
              <span style={{ fontSize:24 }}>{s.icon}</span>
              <span style={{
                fontFamily:"var(--font-syne,'Syne',sans-serif)",
                fontWeight:700, fontSize:26, color:"#fff", lineHeight:1.1,
              }}>{s.value}</span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,.42)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 3 — FEATURES CAROUSEL
      ════════════════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding:"80px 0" }}>
        {/* Heading */}
        <div style={{ textAlign:"center", marginBottom:48, padding:"0 1.5rem" }}>
          <p style={{
            fontSize:11, fontWeight:600, letterSpacing:"0.18em",
            textTransform:"uppercase", color:"rgba(167,139,250,.8)", marginBottom:10,
          }}>Everything You Need</p>
          <h2 style={{
            fontFamily:"var(--font-syne,'Syne',sans-serif)",
            fontWeight:700,
            fontSize:"clamp(1.75rem,3.5vw,2.5rem)",
            color:"#fff", marginBottom:12,
          }}>Powerful Features</h2>
          <p style={{
            color:"rgba(255,255,255,.42)", fontSize:14,
            maxWidth:420, margin:"0 auto", lineHeight:1.7,
          }}>
            Every tool you need to go from nervous candidate to confident professional.
          </p>
        </div>

        {/* Carousel */}
        <div style={{ position:"relative" }}>
          {/* Fade edges */}
          <div style={{
            position:"absolute", left:0, top:0, bottom:0, width:80, zIndex:10,
            background:"linear-gradient(to right,#0a0a0a,transparent)", pointerEvents:"none",
          }} />
          <div style={{
            position:"absolute", right:0, top:0, bottom:0, width:80, zIndex:10,
            background:"linear-gradient(to left,#0a0a0a,transparent)", pointerEvents:"none",
          }} />

          <div
            ref={scrollRef}
            className="hide-scrollbar"
            style={{
              display:"flex", gap:40, overflowX:"auto",
              padding:"8px 64px 16px", scrollBehavior:"smooth",
            }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="card-hover"
                onClick={() => setActive(i)}
                style={{
                  flexShrink:0, width:350,
                  display:"flex", flexDirection:"column", gap:16,
                  padding:24, borderRadius:20, cursor:"pointer",
                  background:"rgba(255,255,255,.03)", backdropFilter:"blur(8px)",
                  border:`1px solid ${activeFeature===i
                    ? "rgba(99,102,241,.45)"
                    : "rgba(255,255,255,.08)"}`,
                  boxShadow:activeFeature===i
                    ? "0 0 28px rgba(99,102,241,.18)" : "none",
                  transition:"border-color .25s, box-shadow .25s",
                }}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <span style={{ fontSize:30 }}>{f.icon}</span>
                  <span style={{
                    fontSize:10, fontWeight:600, letterSpacing:"0.12em",
                    textTransform:"uppercase", color:"rgba(147,197,253,.8)",
                    background:"rgba(59,130,246,.12)", padding:"3px 9px",
                    borderRadius:999, border:"1px solid rgba(59,130,246,.22)",
                  }}>{f.tag}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <h3 style={{
                    fontFamily:"var(--font-syne,'Syne',sans-serif)",
                    fontWeight:600, fontSize:15, color:"#fff", lineHeight:1.35,
                  }}>{f.title}</h3>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,.48)", lineHeight:1.65 }}>
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:16 }}>
            {FEATURES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  border:"none", padding:0, cursor:"pointer", borderRadius:999,
                  background:i===activeFeature ? "#3b82f6" : "rgba(255,255,255,.20)",
                  width:i===activeFeature ? 24 : 7, height:7,
                  transition:"all .3s ease",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 4 — HOW IT WORKS
      ════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding:"80px 1.5rem" }}>
        <div style={{ maxWidth:1000, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <p style={{
              fontSize:11, fontWeight:600, letterSpacing:"0.18em",
              textTransform:"uppercase", color:"rgba(147,197,253,.8)", marginBottom:10,
            }}>Simple Process</p>
            <h2 style={{
              fontFamily:"var(--font-syne,'Syne',sans-serif)",
              fontWeight:700,
              fontSize:"clamp(1.75rem,3.5vw,2.5rem)",
              color:"#fff", marginBottom:12,
            }}>How It Works</h2>
            <p style={{
              color:"rgba(255,255,255,.42)", fontSize:14,
              maxWidth:380, margin:"0 auto", lineHeight:1.7,
            }}>
              From zero to interview-ready in three simple steps.
            </p>
          </div>

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
            gap:20,
          }}>
            {STEPS.map(step => (
              <div
                key={step.number}
                className="card-hover"
                style={{
                  display:"flex", flexDirection:"column", gap:20,
                  padding:28, borderRadius:20, cursor:"default",
                  background:"rgba(255,255,255,.03)", backdropFilter:"blur(8px)",
                  border:"1px solid rgba(255,255,255,.08)",
                }}
              >
                <div style={{
                  width:48, height:48, borderRadius:14,
                  background:"linear-gradient(135deg,rgba(37,99,235,.28),rgba(124,58,237,.28))",
                  border:"1px solid rgba(99,102,241,.24)",
                  display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:22,
                }}>
                  {step.icon}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{
                      fontSize:10, fontFamily:"monospace",
                      color:"rgba(96,165,250,.6)", fontWeight:600,
                    }}>{step.number}</span>
                    <h3 style={{
                      fontFamily:"var(--font-syne,'Syne',sans-serif)",
                      fontWeight:600, fontSize:15, color:"#fff",
                    }}>{step.title}</h3>
                  </div>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,.44)", lineHeight:1.65 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 5 — ABOUT / VALUE
      ════════════════════════════════════════════════════════════════════ */}
      <section id="about" style={{ padding:"60px 1.5rem" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{
            position:"relative", borderRadius:28, padding:"52px 44px",
            border:"1px solid rgba(255,255,255,.08)",
            background:"rgba(255,255,255,.02)", overflow:"hidden",
          }}>
            {/* Decorative blobs */}
            <div style={{
              position:"absolute", top:-80, right:-80,
              width:260, height:260, borderRadius:"50%",
              background:"rgba(124,58,237,.10)", filter:"blur(60px)", pointerEvents:"none",
            }} />
            <div style={{
              position:"absolute", bottom:-80, left:-80,
              width:260, height:260, borderRadius:"50%",
              background:"rgba(37,99,235,.10)", filter:"blur(60px)", pointerEvents:"none",
            }} />

            <div style={{ position:"relative", display:"flex", flexDirection:"column", gap:20 }}>
              <p style={{
                fontSize:11, fontWeight:600, letterSpacing:"0.18em",
                textTransform:"uppercase", color:"rgba(167,139,250,.8)",
              }}>Why InterPrep</p>

              <h2 style={{
                fontFamily:"var(--font-syne,'Syne',sans-serif)",
                fontWeight:700,
                fontSize:"clamp(1.6rem,3vw,2.2rem)",
                color:"#fff", lineHeight:1.25, maxWidth:600,
              }}>
                Built for candidates who want to{" "}
                <span style={{
                  background:"linear-gradient(135deg,#60a5fa,#a78bfa)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                }}>actually improve.</span>
              </h2>

              <p style={{
                fontSize:15, color:"rgba(255,255,255,.52)",
                lineHeight:1.75, maxWidth:580,
              }}>
                This platform simulates real interviews using AI, helping you improve
                communication, confidence, and technical clarity — session by session.
              </p>

              {/* Value pillars */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:8 }}>
                {PILLARS.map(p => (
                  <div key={p.text} style={{
                    padding:"8px 16px", borderRadius:999,
                    fontSize:13, fontWeight:500,
                    color:`${p.color}cc`,
                    background:`${p.color}18`,
                    border:`1px solid ${p.color}38`,
                  }}>
                    ✓ {p.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 6 — AUTH / CTA
      ════════════════════════════════════════════════════════════════════ */}
      <section id="auth" style={{ padding:"80px 1.5rem" }}>
        <div style={{ maxWidth:520, margin:"0 auto" }}>
          <div style={{
            position:"relative", borderRadius:28, padding:"52px 40px",
            textAlign:"center", overflow:"hidden",
            border:"1px solid rgba(255,255,255,.10)",
            background:"rgba(255,255,255,.03)", backdropFilter:"blur(12px)",
            boxShadow:"0 0 80px rgba(99,102,241,.07)",
          }}>
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(160deg,rgba(37,99,235,.06),rgba(124,58,237,.06),transparent)",
              pointerEvents:"none",
            }} />

            {/* Icon */}
            <div style={{
              position:"relative",
              width:60, height:60, borderRadius:18, margin:"0 auto 22px",
              background:"linear-gradient(135deg,#2563eb,#7c3aed)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:26, boxShadow:"0 0 28px rgba(99,102,241,.40)",
            }}>🚀</div>

            <h2 style={{
              position:"relative",
              fontFamily:"var(--font-syne,'Syne',sans-serif)",
              fontWeight:700,
              fontSize:"clamp(1.4rem,3vw,1.9rem)",
              color:"#fff", marginBottom:12,
            }}>Start Your Interview Journey</h2>

            <p style={{
              position:"relative",
              color:"rgba(255,255,255,.42)", fontSize:13,
              lineHeight:1.7, maxWidth:360, margin:"0 auto 32px",
            }}>
              Join thousands of candidates practicing smarter and landing better roles.
            </p>

            <div style={{
              position:"relative",
              display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap",
            }}>
              <button className="btn-secondary" style={{
                padding:"12px 26px", borderRadius:12,
                fontSize:13, fontWeight:500,
                color:"rgba(255,255,255,.75)", cursor:"pointer", minWidth:120,
              }} onClick={() => router.push('/auth/signin')}>Sign In</button>
              <button className="btn-primary" style={{
                padding:"12px 26px", borderRadius:12,
                fontSize:13, fontWeight:600, color:"#fff",
                cursor:"pointer", minWidth:175,
                boxShadow:"0 0 20px rgba(99,102,241,.38)",
              }} onClick={() => router.push('/auth/signup')}>Create Free Account →</button>
            </div>

            <p style={{
              position:"relative",
              fontSize:11, color:"rgba(255,255,255,.22)", marginTop:20,
            }}>
              No credit card required · Free forever on basic plan
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════ */}
      <footer style={{
        borderTop:"1px solid rgba(255,255,255,.06)",
        padding:"44px 2rem",
      }}>
        <div style={{
          maxWidth:1000, margin:"0 auto",
          display:"flex", flexWrap:"wrap",
          alignItems:"flex-start", justifyContent:"space-between", gap:32,
        }}>
          {/* Brand */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{
                width:26, height:26, borderRadius:8,
                background:"linear-gradient(135deg,#2563eb,#7c3aed)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, fontWeight:700, color:"#fff",
                fontFamily:"var(--font-syne,'Syne',sans-serif)",
              }}>IP</div>
              <span style={{
                fontFamily:"var(--font-syne,'Syne',sans-serif)",
                fontWeight:600, fontSize:14, color:"#fff",
              }}>InterPrep</span>
            </div>
            <p style={{
              fontSize:13, color:"rgba(255,255,255,.28)",
              maxWidth:200, lineHeight:1.6,
            }}>
              Practice smart. Interview better. Land your dream role.
            </p>
          </div>

          {/* Links */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px 32px" }}>
            {FOOTER_LINKS.map(link => (
              <a key={link.text} href={link.href} className="footer-link" target={link.href.startsWith('http') ? '_blank' : '_self'} rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}>{link.text}</a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          maxWidth:1000, margin:"28px auto 0",
          paddingTop:20, borderTop:"1px solid rgba(255,255,255,.04)",
          display:"flex", flexWrap:"wrap",
          justifyContent:"space-between", gap:8,
        }}>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.28)" }}>
            © {new Date().getFullYear()} InterPrep. All rights reserved.
          </p>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.28)" }}>
            Made with ♥ for job seekers everywhere
          </p>
        </div>
      </footer>
    </main>
  );
}