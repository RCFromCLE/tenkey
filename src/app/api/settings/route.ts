import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma as db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First try to find the user, if not found, create them
    let user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { openRouterApiKey: true, openaiApiKey: true, googleCredentials: true },
    });

    if (!user) {
      // If user doesn't exist by ID, check if they exist by email first
      if (session.user.email) {
        const existingUserByEmail = await db.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, openRouterApiKey: true, openaiApiKey: true, googleCredentials: true },
        });
        
        if (existingUserByEmail) {
          // User exists with this email but different ID - update the ID
          user = await db.user.update({
            where: { email: session.user.email },
            data: { 
              id: session.user.id,
              name: session.user.name,
              image: session.user.image,
            },
            select: { openRouterApiKey: true, openaiApiKey: true, googleCredentials: true },
          });
        }
      }
      
      // If still no user found, create a new one
      if (!user) {
        try {
          user = await db.user.create({
            data: {
              id: session.user.id,
              email: session.user.email || `${session.user.id}@placeholder.local`,
              name: session.user.name,
              image: session.user.image,
            },
            select: { openRouterApiKey: true, openaiApiKey: true, googleCredentials: true },
          });
        } catch (createError: any) {
          console.error('Error creating user:', createError?.message || createError);
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }
      }
    }

    // Never send actual API keys back to the client
    // Only indicate whether they are set or not
    return NextResponse.json({
      hasOpenRouterApiKey: !!user.openRouterApiKey,
      hasOpenAIKey: !!user.openaiApiKey,
      hasGoogleCredentials: !!user.googleCredentials,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error?.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Only update fields that are provided in the request
    const updateData: any = {};
    
    if (body.openRouterApiKey !== undefined) {
      updateData.openRouterApiKey = body.openRouterApiKey;
    }
    
    if (body.openaiApiKey !== undefined) {
      updateData.openaiApiKey = body.openaiApiKey;
    }
    
    if (body.googleCredentials !== undefined) {
      updateData.googleCredentials = body.googleCredentials;
    }

    // If no fields to update, return early
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Check if user exists by ID first
    let existingUser = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!existingUser && session.user.email) {
      // Check if user exists by email
      existingUser = await db.user.findUnique({
        where: { email: session.user.email },
      });
      
      // If found by email but different ID, update the ID
      if (existingUser) {
        existingUser = await db.user.update({
          where: { email: session.user.email },
          data: { 
            id: session.user.id,
            name: session.user.name,
            image: session.user.image,
          },
        });
      }
    }

    if (existingUser) {
      // Update existing user
      await db.user.update({
        where: { id: session.user.id },
        data: updateData,
      });
    } else {
      // Create new user
      await db.user.create({
        data: {
          id: session.user.id,
          email: session.user.email || `${session.user.id}@placeholder.local`,
          name: session.user.name,
          image: session.user.image,
          ...updateData,
        },
      });
    }
    
    return NextResponse.json({ message: 'Settings saved' }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving settings:', error?.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
