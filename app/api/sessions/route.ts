import { NextResponse } from 'next/server';
import { createSession, listSessions } from '@/lib/habla-store';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ sessions: listSessions() });
}

export async function POST() {
  return NextResponse.json(createSession(), { status: 201 });
}
