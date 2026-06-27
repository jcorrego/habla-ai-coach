import { NextResponse } from 'next/server';
import { getReport, getSession } from '@/lib/habla-store';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  return NextResponse.json({ session, report: getReport(id) ?? null });
}
