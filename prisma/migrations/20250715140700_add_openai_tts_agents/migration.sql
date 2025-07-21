-- Add OpenAI API key and agent voice configurations
ALTER TABLE "User" ADD COLUMN "openaiApiKey" TEXT;
ALTER TABLE "User" ADD COLUMN "agentVoiceConfigs" JSONB DEFAULT '{}';
