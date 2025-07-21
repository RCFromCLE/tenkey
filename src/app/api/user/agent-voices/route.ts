// src/app/api/user/agent-voices/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '../../../../lib/auth/config';
import { prisma } from '../../../../lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        agentVoiceConfigs: true
      }
    });

    return NextResponse.json({
      agentVoiceConfigs: user?.agentVoiceConfigs || {}
    });
  } catch (error: any) {
    console.error('Error fetching agent voice configs:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to fetch agent voice configs' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    console.log('PUT /api/user/agent-voices - Session:', session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentVoiceConfigs } = body;
    console.log('Updating agent voice configs:', agentVoiceConfigs);

    if (!agentVoiceConfigs) {
      return NextResponse.json(
        { error: 'No voice configs provided' },
        { status: 400 }
      );
    }

    // First, ensure the user exists or create them
    let user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      console.log('User not found, checking by email:', session.user.email);
      
      // Check if user exists by email first
      if (session.user.email) {
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
        
        if (existingUserByEmail) {
          // User exists with this email but different ID - update the ID
          user = await prisma.user.update({
            where: { email: session.user.email },
            data: { 
              id: session.user.id,
              name: session.user.name,
              image: session.user.image,
            },
          });
          console.log('Updated existing user with new ID:', session.user.id);
        }
      }
      
      // If still no user found, create a new one
      if (!user) {
        console.log('Creating new user:', session.user.id);
        try {
          user = await prisma.user.create({
            data: {
              id: session.user.id,
              email: session.user.email || `${session.user.id}@placeholder.local`,
              name: session.user.name || null,
              image: session.user.image || null,
              agentVoiceConfigs: agentVoiceConfigs || {}
            }
          });
        } catch (createError: any) {
          console.error('Error creating user:', createError?.message || createError);
          return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
          );
        }
      }
    }

    // Update user voice configs
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        agentVoiceConfigs
      },
      select: {
        agentVoiceConfigs: true
      }
    });

    console.log('Updated agent voice configs:', updatedUser.agentVoiceConfigs);

    return NextResponse.json({
      message: 'Voice configs updated successfully',
      agentVoiceConfigs: updatedUser.agentVoiceConfigs
    });
  } catch (error: any) {
    console.error('Error updating agent voice configs:', error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update voice configs' },
      { status: 500 }
    );
  }
}
