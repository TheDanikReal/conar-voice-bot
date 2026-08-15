-- AlterTable
ALTER TABLE "TempChannel" ADD COLUMN     "blacklist" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "closed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxMembers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requests" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Save" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bitrate" INTEGER NOT NULL,
    "memberLimit" INTEGER NOT NULL,
    "requestsEnabled" BOOLEAN NOT NULL,

    CONSTRAINT "Save_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Save_userId_idx" ON "Save"("userId");

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserSettings"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
