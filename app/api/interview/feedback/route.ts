// app/api/interview/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFeedback }               from "@/lib/ai";
import connectDB                     from "@/lib/mongodb";
import Session                       from "@/models/Session";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/authOptions";

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

    const { sessionId, questionId, questionText, answerText, timeTakenSecs } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    if (!questionText || typeof questionText !== "string") {
      return NextResponse.json({ error: "questionText is required" }, { status: 400 });
    }
    if (!answerText || typeof answerText !== "string" || !answerText.trim()) {
      return NextResponse.json({ error: "answerText is required" }, { status: 400 });
    }

    // ── 3. DB connect + ownership check ─────────────────────────────────────
    await connectDB();

    const interviewSession = await Session.findOne({
      _id:    sessionId,
      userId: session.user.id,  // ensures user can only access their own sessions
    });

    if (!interviewSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (interviewSession.status === "completed") {
      return NextResponse.json({ error: "Session already completed" }, { status: 400 });
    }

    // ── 4. Prevent duplicate answers for same question ───────────────────────
    const alreadyAnswered = interviewSession.responses.some(
      (r: { questionId: string }) => r.questionId === questionId
    );
    if (alreadyAnswered) {
      return NextResponse.json({ error: "Question already answered" }, { status: 409 });
    }

    // ── 5. Call AI for feedback ──────────────────────────────────────────────
    const feedback = await getFeedback(questionText.trim(), answerText.trim());

    // ── 6. Push response into session ────────────────────────────────────────
    interviewSession.responses.push({
      questionId,
      answerText:    answerText.trim(),
      timeTakenSecs: timeTakenSecs ?? 0,
      feedback,
      answeredAt:    new Date(),
    });

    // ── 7. Update status to in_progress + set startedAt once ────────────────
    if (interviewSession.status === "created") {
      interviewSession.status    = "in_progress";
      interviewSession.startedAt = new Date();
    }

    // ── 8. Auto-complete if all questions answered ───────────────────────────
    const totalQuestions  = interviewSession.questions.length;
    const totalAnswered   = interviewSession.responses.length;

    if (totalAnswered >= totalQuestions) {
      interviewSession.status      = "completed";
      interviewSession.completedAt = new Date();
    }

    // ── 9. Recalculate aggregate scores ─────────────────────────────────────
    interviewSession.recalculateScores();
    await interviewSession.save();

    // ── 10. Respond ──────────────────────────────────────────────────────────
    return NextResponse.json(
      {
        feedback,
        progress: {
          answered:  totalAnswered,
          total:     totalQuestions,
          completed: interviewSession.status === "completed",
        },
        scores: {
          overall:    interviewSession.overallScore,
          technical:  interviewSession.technicalScore,
          behavioral: interviewSession.behavioralScore,
          completion: interviewSession.completionRate,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[/api/interview/feedback]", error);
    return NextResponse.json(
      { error: "Failed to get feedback. Please try again." },
      { status: 500 }
    );
  }
}