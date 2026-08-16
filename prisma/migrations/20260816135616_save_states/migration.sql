/*
  Warnings:

  - A unique constraint covering the columns `[userId,slotNum]` on the table `Save` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slotNum` to the `Save` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Save" ADD COLUMN     "blacklist" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "closed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "slotNum" INTEGER NOT NULL,
ALTER COLUMN "memberLimit" SET DEFAULT 0,
ALTER COLUMN "requestsEnabled" SET DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Save_userId_slotNum_key" ON "Save"("userId", "slotNum");
