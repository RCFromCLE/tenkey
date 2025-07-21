-- CreateTable
CREATE TABLE "FilingAnalysis" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "filingId" TEXT NOT NULL,
    "filingType" TEXT NOT NULL,
    "filingDate" TIMESTAMP(3) NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "netIncome" DOUBLE PRECISION NOT NULL,
    "cashFlow" DOUBLE PRECISION NOT NULL,
    "segments" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilingAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FilingAnalysis_companyId_filingId_key" ON "FilingAnalysis"("companyId", "filingId");
