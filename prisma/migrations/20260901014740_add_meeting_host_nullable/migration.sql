-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "hostId" TEXT;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
