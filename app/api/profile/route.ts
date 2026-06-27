import { NextResponse } from 'next/server';
import { getProfile, updateProfile } from '@/lib/habla-store';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(getProfile());
}

export async function POST(request: Request) {
  const body = await request.json();
  const profile = updateProfile({
    display_name: body.display_name || 'Demo Student',
    target_level: body.target_level || 'B2',
    native_language: body.native_language || 'es'
  });
  return NextResponse.json(profile);
}
