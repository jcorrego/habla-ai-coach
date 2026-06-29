import { NextResponse } from 'next/server';
import { progressSummary } from '@/lib/habla-store';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(await progressSummary());
}
