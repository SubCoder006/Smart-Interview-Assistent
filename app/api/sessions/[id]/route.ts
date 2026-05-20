import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Session from "@/models/Session";
import { authOptions } from "@/lib/authOptions";

// GET /api/sessions/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const interviewSession = await Session.findOne({
      _id: id,
      userId: session.user.id,
    });
    if (!interviewSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ session: interviewSession }, { status: 200 });
  } catch (err) {
    console.error("Error fetching session:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
