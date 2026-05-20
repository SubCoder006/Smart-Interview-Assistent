import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "Smart Interview Assistant",
    template: "%s · Smart Interview Assistant",
  },
  description:
    "AI-powered interview preparation. Practice with real questions, get instant feedback, and land your dream role.",
  keywords: ["interview", "AI", "job preparation", "career", "practice"],
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#0a0a0a] text-white antialiased overflow-x-hidden">
        <div className="fixed inset-0 -z-10">
          {/* Base dark layer */}
          <div className="absolute inset-0 bg-[#0a0a0a]" />

          {/* Gradient mesh (main beauty) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.15),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.15),transparent_40%)]" />

          {/* Soft glowing blobs */}
          <div className="absolute -top-25 -left-25 w-150 h-150 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-30 -right-25 w-150 h-150 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -top-15 -left-20 w-100 h-100 bg-green-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-15 w-100 h-100 bg-pink-500/20 rounded-full blur-3xl" />

          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-violet-500/10 to-black/10" />
        </div>

        {/* ── Scanline keyframes ─────────────────────────────────────────── */}
        <style>{`
          @keyframes scanline {
            0%   { transform: translateX(-8%) skewX(-2deg); opacity: 0;   }
            15%  { opacity: 1; }
            65%  { opacity: 1; }
            100% { transform: translateX(8%)  skewX(2deg);  opacity: 0;   }
          }
          @keyframes scanline-v {
            0%   { transform: translateY(-8%); opacity: 0;   }
            15%  { opacity: 1; }
            85%  { opacity: 1; }
            100% { transform: translateY(8%);  opacity: 0;   }
          }
          @media (prefers-reduced-motion: reduce) {
            [style*="scanline"] { animation: none !important; }
          }
        `}</style>

        {/* ── App shell ──────────────────────────────────────────────────── */}
        <Providers>
          <div className="relative flex min-h-screen flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
