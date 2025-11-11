import { NextRequest, NextResponse } from 'next/server';
import { PlanTripInputSchema, planTrip } from '@/ai/flows/plan-trip';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Check for API key
    if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
      console.error('Missing GOOGLE_GENAI_API_KEY or GOOGLE_API_KEY environment variable');
      return NextResponse.json({ 
        error: 'API key not configured', 
        message: 'Please set GOOGLE_GENAI_API_KEY or GOOGLE_API_KEY in your .env.local file' 
      }, { status: 500 });
    }

    const body = await req.json();
    console.log('Received plan request:', { destination: body.destination, dates: `${body.startDate} to ${body.endDate}` });
    
    const parsed = PlanTripInputSchema.safeParse(body);
    if (!parsed.success) {
      console.error('Validation error:', parsed.error.flatten());
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    console.log('Calling planTrip flow...');
    const result = await planTrip(parsed.data);
    console.log('Plan generated successfully');
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('AI plan error:', err);
    console.error('Error stack:', err.stack);
    return NextResponse.json({ 
      error: 'Failed to generate plan', 
      message: err.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
