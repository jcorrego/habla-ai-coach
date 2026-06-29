import { NextResponse } from 'next/server';
import { listPracticeScenarios } from '@/lib/habla-store';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ scenarios: listPracticeScenarios() });
}
