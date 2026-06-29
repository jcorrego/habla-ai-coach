import { NextResponse } from 'next/server';
import { createSession, listSessions } from '@/lib/habla-store';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ sessions: await listSessions() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json(await createSession(body.scenario_id), { status: 201 });
}
