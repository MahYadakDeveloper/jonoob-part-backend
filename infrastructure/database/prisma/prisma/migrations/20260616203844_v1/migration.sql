-- CreateTable
CREATE TABLE "Good" (
    "id" SERIAL NOT NULL,
    "goodId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Good_pkey" PRIMARY KEY ("id")
);
