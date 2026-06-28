import { NextResponse } from 'next/server';
import { finishAndAnalyze } from '@/lib/habla-store';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

const fallbackTranscript = `Teacher: Tell me about a recent work challenge.
Student: Last week I worked on an AI automation project. It was difficult because the requirements changed, however I made a small plan and explained the tradeoffs to the team.`;

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  try {
    return NextResponse.json(await finishAndAnalyze(id, body.transcript || fallbackTranscript));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 404 });
  }
}
