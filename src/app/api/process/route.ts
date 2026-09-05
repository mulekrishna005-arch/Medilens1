import { NextRequest, NextResponse } from 'next/server';
import { runMedLensPipeline, ProcessPipelineInput } from '@/lib/pipeline';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ProcessPipelineInput;

    if (!body || !body.patient) {
      return NextResponse.json(
        { error: 'Invalid payload: patient intake information is required.' },
        { status: 400 }
      );
    }

    if (!body.currentReportText || !body.currentReportText.trim()) {
      return NextResponse.json(
        { error: 'Invalid payload: current medical report text is required.' },
        { status: 400 }
      );
    }

    // Execute the full 7-stage MedLens pipeline
    const record = runMedLensPipeline(body);

    return NextResponse.json({
      success: true,
      data: record
    });
  } catch (err: unknown) {
    console.error('Error in MedLens pipeline processing:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during medical report processing.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
