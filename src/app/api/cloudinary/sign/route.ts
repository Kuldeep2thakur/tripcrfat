import { NextResponse } from 'next/server';
import { generateSignature } from '@/lib/cloudinary-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paramsToSign } = body;

    const { signature, timestamp } = await generateSignature(paramsToSign || {});

    return NextResponse.json({ signature, timestamp });
  } catch (error) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}