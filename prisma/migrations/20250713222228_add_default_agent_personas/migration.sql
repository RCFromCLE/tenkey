-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultAgentPersonas" TEXT[] DEFAULT ARRAY[]::TEXT[];
