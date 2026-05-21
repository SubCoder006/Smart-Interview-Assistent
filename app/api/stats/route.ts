import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Sessions from "@/models/Sessions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Example stats: total sessions, sessions this month, last session date
    const totalSessions = user.stats?.totalSessions || 0;
    const sessionsUsedThisMonth = user.sessionsUsedThisMonth || 0;
    const lastSessionAt = user.stats?.lastSessionAt || null;
    return NextResponse.json({
      totalSessions,
      sessionsUsedThisMonth,
      lastSessionAt,
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
