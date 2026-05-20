import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Sessions from "@/models/Sessions";
import { authOptions } from "@/lib/authOptions";

// GET /api/sessions/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessions = await getServerSession(authOptions);
    if (!sessions?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const interviewSession = await Sessions.findOne({
      _id: id,
      userId: sessions.user.id,
    });
    if (!interviewSession) {
      return NextResponse.json({ error: "Sessions not found" }, { status: 404 });
    }
    return NextResponse.json({ sessions: interviewSession }, { status: 200 });
  } catch (err) {
    console.error("Error fetching sessions:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
