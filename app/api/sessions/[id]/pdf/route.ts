import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Sessions from "@/models/Sessions";
import { generateConversationPDF } from "@/lib/generatePdf";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  await connectDB();
  const interviewSession = await Sessions.findOne({ _id: sessionId, userId: session.user.id }); // from sessions
  if (!interviewSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (interviewSession.status !== "completed") {
    return NextResponse.json({ error: "Session not completed" }, { status: 400 });
  }

  // Compose conversation array
  const conversation = interviewSession.questions.map((q, idx) => {
    const response = interviewSession.responses.find((r) => r.questionId === q.id);
    return [
      { role: "system", content: `Q${idx + 1}: ${q.text}` },
      response
        ? { role: "user", content: response.answerText }
        : { role: "user", content: "No answer." },
    ];
  }).flat();

  // Generate PDF
  const pdfBytes = await generateConversationPDF(conversation, {
    sessionCode: interviewSession.sessionCode,
    completedAt: interviewSession.completedAt?.toISOString(),
    role: interviewSession.role,
    company: interviewSession.company,
    level: interviewSession.level,
  });

  // Store PDF in /tmp or /public/pdfs (ensure directory exists)
  const pdfDir = path.join(process.cwd(), "public", "pdfs");
  await fs.mkdir(pdfDir, { recursive: true });
  const pdfPath = path.join(pdfDir, `${interviewSession.sessionCode}.pdf`);
  await fs.writeFile(pdfPath, pdfBytes);

  // Return download URL
  const url = `/pdfs/${interviewSession.sessionCode}.pdf`;
  return NextResponse.json({ url });
}
