// Deprecated: Use /api/sessions for session history.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Deprecated. Use /api/sessions.' }, { status: 410 });
}
