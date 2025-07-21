-- AlterTable
ALTER TABLE "User" ADD COLUMN "defaultChatModel" TEXT DEFAULT 'google/gemini-2.0-flash-exp';
ALTER TABLE "User" ADD COLUMN "defaultAgentModel" TEXT DEFAULT 'openai/gpt-4o';
