import { NextResponse } from 'next/server';
import { resetDemoData } from '@/lib/habla-store';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(await resetDemoData());
}
