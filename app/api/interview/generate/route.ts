// app/api/interview/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateQuestions }         from "@/lib/ai";
import connectDB                     from "@/lib/mongodb";
import Session                       from "@/models/Session";
import User                          from "@/models/User";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/authOptions"; // your NextAuth config

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth guard ────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Parse + validate body ─────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { role, level, resumeText, difficulty, count, company } = body;

    if (!role || typeof role !== "string") {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
    }
    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json({ error: "resumeText is required" }, { status: 400 });
    }

    // ── 3. DB connect + load user ────────────────────────────────────────────
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── 4. Plan / usage limit check ──────────────────────────────────────────
    if (!user.canStartSession()) {
      return NextResponse.json(
        { error: `Monthly limit reached (${user.monthlyLimit} sessions). Upgrade to Pro.` },
        { status: 429 }
      );
    }

    // ── 5. Call AI ───────────────────────────────────────────────────────────
    const startTime = Date.now();

    const questions = await generateQuestions({
      role:       role.trim(),
      level:      level       ?? user.preferences.targetLevel,
      resumeText: resumeText.trim(),
      difficulty: difficulty  ?? user.preferences.preferredDifficulty,
      count:      count       ?? user.preferences.questionCount,
      skills:     user.skills,
    });

    const generationMs = Date.now() - startTime;

    // ── 6. Save session to MongoDB ───────────────────────────────────────────
    const newSession = await Session.create({
      userId:          user._id,
      role:            role.trim(),
      level:           level    ?? user.preferences.targetLevel,
      company:         company  ?? "",
      resumeSnapshot:  resumeText.trim().slice(0, 1000),
      questions,
      status:          "created",
      aiMeta: {
        provider:     process.env.AI_PROVIDER ?? "ollama",
        model:        process.env.OLLAMA_MODEL ?? process.env.HF_MODEL ?? "",
        generationMs,
        totalTokensUsed: 0,
      },
    });

    // ── 7. Increment usage counter ───────────────────────────────────────────
    await User.findByIdAndUpdate(user._id, {
      $inc: { sessionsUsedThisMonth: 1, "stats.totalSessions": 1 },
    });

    // ── 8. Respond ───────────────────────────────────────────────────────────
    return NextResponse.json(
      { sessionId: newSession._id, sessionCode: newSession.sessionCode, questions },
      { status: 201 }
    );

  } catch (error) {
    console.error("[/api/interview/generate]", error);
    return NextResponse.json(
      { error: "Failed to generate questions. Please try again." },
      { status: 500 }
    );
  }
}