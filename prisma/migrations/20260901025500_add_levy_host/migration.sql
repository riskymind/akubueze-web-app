-- AlterTable
ALTER TABLE "Levy" ADD COLUMN     "hostId" TEXT;

-- AddForeignKey
ALTER TABLE "Levy" ADD CONSTRAINT "Levy_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
