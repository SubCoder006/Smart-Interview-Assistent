// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Sessions from "@/models/Sessions";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  try {
    // ── 1. Auth guard ────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    // Temporarily disable auth check for debugging
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Use a test user ID for debugging
    const testUserId = session?.user?.id || "507f1f77bcf86cd799439011"; // MongoDB ObjectId format

    // ── 2. Connect to DB ─────────────────────────────────────────────────────
    await connectDB();

    // ── 3. Get user stats ────────────────────────────────────────────────────
    const user = await User.findById(testUserId);
    // For debugging, return mock data if user not found
    if (!user) {
      console.log("User not found, returning mock data");
      const mockStatsCards = [
        { id: 1, title: 'Total Interviews', count: 0 },
        { id: 2, title: 'Average Score', count: 0 },
        { id: 3, title: 'Questions Practiced', count: 0 },
        { id: 4, title: 'Best Score', count: 0 },
      ];
      return NextResponse.json({
        statsCards: mockStatsCards,
        recentSessions: [],
      });
    }

    // ── 4. Get recent sessions ───────────────────────────────────────────────
    const recentSessions = await Sessions.find({
      userId: testUserId,
      createdAt: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('sessionCode status overallScore createdAt completedAt')
      .lean();

    // ── 5. Calculate additional stats ────────────────────────────────────────
    const totalQuestionsPracticed = await Sessions.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: { $size: "$responses" } } } }
    ]);

    const questionsPracticed = totalQuestionsPracticed[0]?.total || 0;

    // ── 6. Prepare response ──────────────────────────────────────────────────
    const statsCards = [
      {
        id: 1,
        title: 'Total Interviews',
        count: user.stats.totalSessions,
      },
      {
        id: 2,
        title: 'Average Score',
        count: user.stats.avgOverallScore,
      },
      {
        id: 3,
        title: 'Questions Practiced',
        count: questionsPracticed,
      },
      {
        id: 4,
        title: 'Best Score',
        count: user.stats.bestScore,
      },
    ];

    return NextResponse.json({
      statsCards,
      recentSessions: recentSessions.map(session => ({
        _id: session._id,
        sessionCode: session.sessionCode,
        status: session.status,
        overallScore: session.overallScore,
        createdAt: session.createdAt,
        completedAt: session.completedAt,
      })),
    });

  } catch (error) {
    console.error("[/api/dashboard]", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}