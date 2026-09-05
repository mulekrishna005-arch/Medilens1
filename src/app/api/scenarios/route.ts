import { NextResponse } from 'next/server';
import { DEMO_SCENARIOS } from '@/lib/demoScenarios';

export async function GET() {
  return NextResponse.json({
    success: true,
    scenarios: DEMO_SCENARIOS
  });
}
