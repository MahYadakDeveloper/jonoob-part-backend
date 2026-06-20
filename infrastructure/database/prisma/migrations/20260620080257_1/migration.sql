/*
  Warnings:

  - A unique constraint covering the columns `[goodId]` on the table `Good` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Good_goodId_key" ON "Good"("goodId");
