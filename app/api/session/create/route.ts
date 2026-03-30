import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Session from "@/models/Session";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { role, resumeText } = body;

    const session = await Session.create({
      role,
      resumeText,
      questions: [],
      answers: [],
      feedback: [],
    });

    return NextResponse.json({
      success: true,
      sessionId: session._id,
    });

  } catch (error) {
    console.error("ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
