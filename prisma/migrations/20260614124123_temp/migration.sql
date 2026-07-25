-- CreateTable
CREATE TABLE "TempChannel" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "TempChannel_pkey" PRIMARY KEY ("id")
);
