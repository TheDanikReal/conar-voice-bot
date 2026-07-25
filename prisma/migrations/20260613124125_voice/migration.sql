/*
  Warnings:

  - You are about to drop the column `audioChannel` on the `ServerSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ServerSettings" DROP COLUMN "audioChannel",
ADD COLUMN     "voiceChannel" TEXT;
