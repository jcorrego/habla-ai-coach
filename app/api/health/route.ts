import { NextResponse } from 'next/server';
import { getDbHealth } from '@/lib/habla-store';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = await getDbHealth();
    return NextResponse.json({
      ok: db.ok,
      app: 'habla-ai-coach',
      product: 'Habla',
      db: db.driver
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      app: 'habla-ai-coach',
      product: 'Habla',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
