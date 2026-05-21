import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Sessions from "@/models/Sessions";
import User from "@/models/User";
import { generateQuestions } from "@/lib/ai";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    // ── Auth guard ──────────────────────────────────────────────────────────
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { role, resumeText = "", company = "", level, difficulty = "medium", questionCount = 5 } = body;

    if (!role || typeof role !== "string") {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
    }

    // ── Load user ────────────────────────────────────────────────────────────
    const user = await User.findById(authSession.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Check monthly limit ──────────────────────────────────────────────────
    if (!user.canStartSession?.()) {
      return NextResponse.json(
        { error: `Monthly limit reached. Upgrade to Pro.` },
        { status: 429 }
      );
    }


    // ── Generate questions and track provider/model ──────────────────────────
    const startTime = Date.now();
    let questions, aiProvider, aiModel;
    try {
      if (process.env.AI_PROVIDER === "huggingface") {
        aiProvider = "huggingface";
        aiModel = process.env.HF_MODEL || "";
      } else if (process.env.AI_PROVIDER === "ollama") {
        aiProvider = "ollama";
        aiModel = process.env.OLLAMA_MODEL || "";
      } else {
        aiProvider = "unknown";
        aiModel = "";
      }
      questions = await generateQuestions({
        role: role.trim(),
        level: level || user.preferences?.targetLevel || "mid",
        resumeText: resumeText.trim() || "No resume provided",
        difficulty: difficulty || user.preferences?.preferredDifficulty || "medium",
        count: questionCount || user.preferences?.questionCount || 5,
        skills: user.skills || [],
      });
    } catch (e) {
      throw e;
    }
    const generationMs = Date.now() - startTime;

    // ── Create session with questions ────────────────────────────────────────
    const newSession = await Sessions.create({
      userId: user._id,
      role: role.trim(),
      level: level || user.preferences?.targetLevel || "mid",
      company: company || "",
      resumeSnapshot: resumeText.trim().slice(0, 1000),
      questions,
      status: "created",
      aiMeta: {
        provider: aiProvider,
        model: aiModel,
        generationMs,
        totalTokensUsed: 0,
      },
    });

    // ── Increment usage counter ──────────────────────────────────────────────
    await User.findByIdAndUpdate(user._id, {
      $inc: { sessionsUsedThisMonth: 1, "stats.totalSessions": 1 },
    });

    return NextResponse.json({
      success: true,
      sessions: {
        _id: newSession._id,
        sessionCode: newSession.sessionCode,
      },
      questions,
    });

  } catch (error) {
    console.error("[/api/sessions/create]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
