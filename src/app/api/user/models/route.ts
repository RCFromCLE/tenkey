// src/app/api/user/models/route.ts
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
        defaultChatModel: true,
        defaultAgentModel: true,
        defaultAgentPersonas: true,
        agentVoiceConfigs: true
      }
    });

    return NextResponse.json({
      defaultChatModel: user?.defaultChatModel || 'google/gemini-2.0-flash-exp:free',
      defaultAgentModel: user?.defaultAgentModel || 'openai/gpt-4o',
      defaultAgentPersonas: user?.defaultAgentPersonas || ['bull', 'bear', 'balanced', 'technical', 'risk'],
      agentVoiceConfigs: user?.agentVoiceConfigs || {}
    });
  } catch (error: any) {
    console.error('Error fetching user models:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to fetch user models' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    console.log('PUT /api/user/models - Session:', session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { defaultChatModel, defaultAgentModel, defaultAgentPersonas } = body;
    console.log('Updating models:', { defaultChatModel, defaultAgentModel, defaultAgentPersonas });

    // Validate that at least one field is being updated
    if (!defaultChatModel && !defaultAgentModel && !defaultAgentPersonas) {
      return NextResponse.json(
        { error: 'No fields to update' },
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
              defaultChatModel: defaultChatModel || 'google/gemini-2.0-flash-exp:free',
              defaultAgentModel: defaultAgentModel || 'openai/gpt-4o',
              defaultAgentPersonas: defaultAgentPersonas || ['bull', 'bear', 'balanced', 'technical', 'risk']
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

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(defaultChatModel && { defaultChatModel }),
        ...(defaultAgentModel && { defaultAgentModel }),
        ...(defaultAgentPersonas !== undefined && { defaultAgentPersonas })
      },
      select: {
        defaultChatModel: true,
        defaultAgentModel: true,
        defaultAgentPersonas: true
      }
    });

    console.log('Updated user:', updatedUser);

    return NextResponse.json({
      message: 'Preferences updated successfully',
      defaultChatModel: updatedUser.defaultChatModel,
      defaultAgentModel: updatedUser.defaultAgentModel,
      defaultAgentPersonas: updatedUser.defaultAgentPersonas
    });
  } catch (error: any) {
    console.error('Error updating user models:', error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update model preferences' },
      { status: 500 }
    );
  }
}
