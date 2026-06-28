import { NextResponse } from 'next/server';
import { startSession } from '@/lib/habla-store';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    return NextResponse.json(await startSession(id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 404 });
  }
}
