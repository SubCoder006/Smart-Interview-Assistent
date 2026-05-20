import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ConversationEntry {
  role: string;
  content: string;
  timestamp?: string;
}

export async function generateConversationPDF(
  conversation: ConversationEntry[],
  sessionInfo?: { sessionCode?: string; completedAt?: string; role?: string; company?: string; level?: string }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = height - 40;
  const leftMargin = 40;
  const lineHeight = 18;

  // Header
  if (sessionInfo) {
    page.drawText(`Session: ${sessionInfo.sessionCode || ''}`, { x: leftMargin, y, size: 14, font, color: rgb(0.2, 0.6, 0.2) });
    y -= lineHeight;
    if (sessionInfo.completedAt) {
      page.drawText(`Completed: ${sessionInfo.completedAt}`, { x: leftMargin, y, size: 12, font, color: rgb(0.3, 0.3, 0.3) });
      y -= lineHeight;
    }
    if (sessionInfo.role) {
      page.drawText(`Role: ${sessionInfo.role}  Level: ${sessionInfo.level || ''}  Company: ${sessionInfo.company || ''}`, { x: leftMargin, y, size: 12, font, color: rgb(0.3, 0.3, 0.3) });
      y -= lineHeight;
    }
    y -= 10;
  }

  // Conversation
  for (const entry of conversation) {
    if (y < 60) {
      page.drawText('...continued on next page...', { x: leftMargin, y, size: 10, font, color: rgb(0.5, 0.2, 0.2) });
      y = height - 40;
      pdfDoc.addPage();
    }
    const prefix = entry.role === 'user' ? 'You: ' : 'AI: ';
    page.drawText(`${prefix}${entry.content}`, { x: leftMargin, y, size: 12, font, color: rgb(0, 0, 0) });
    y -= lineHeight;
  }

  return await pdfDoc.save();
}
