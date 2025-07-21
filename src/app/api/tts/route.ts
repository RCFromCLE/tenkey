import { NextRequest, NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { googleCredentials: true },
    });

    if (!user?.googleCredentials) {
      return new NextResponse('Google credentials are not set', { status: 400 });
    }

    const { text, voice, speakingRate } = await req.json();

    if (!text) {
      return new NextResponse('Text is required', { status: 400 });
    }

    const credentials = JSON.parse(user.googleCredentials);

    const client = new TextToSpeechClient({
      credentials,
    });

    const request = {
      input: { text },
      voice: { languageCode: 'en-US', name: voice || 'en-US-Chirp3-HD-Charon' },
      audioConfig: {
        audioEncoding: 'LINEAR16' as const,
        speakingRate: speakingRate || 1,
      },
    };

    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    if (!audioContent) {
      return new NextResponse('Failed to generate audio', { status: 500 });
    }

    return new NextResponse(audioContent, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
      },
    });
  } catch (error) {
    console.error('Error in TTS route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
