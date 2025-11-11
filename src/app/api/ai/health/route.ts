import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const hasKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY);
  
  return NextResponse.json({
    status: hasKey ? 'configured' : 'missing_api_key',
    message: hasKey 
      ? 'API key is configured' 
      : 'GOOGLE_GENAI_API_KEY or GOOGLE_API_KEY not found in environment',
    envVars: {
      GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY ? '✓ Set' : '✗ Not set',
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? '✓ Set' : '✗ Not set',
    }
  });
}
