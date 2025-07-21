-- CreateTable
CREATE TABLE "AgentConversation" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "participants" TEXT[],
    "messages" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "summary" TEXT,
    "summaryModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentConversation_userEmail_createdAt_idx" ON "AgentConversation"("userEmail", "createdAt" DESC);
