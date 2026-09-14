import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { canUploadMinutes } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";

const f = createUploadthing();

export const ourFileRouter = {
  // Meeting minutes — any file type (PDF, Word doc, image, ...), one at a time.
  minutesUploader: f({ blob: { maxFileSize: "16MB", maxFileCount: 1 } })
    .input(z.object({ meetingId: z.string().min(1) }))
    .middleware(async ({ input }) => {
      const session = await getServerSession(authOptions);
      if (!canUploadMinutes(session?.user.role)) {
        throw new UploadThingError("Not authorized to upload minutes.");
      }

      const meeting = await prisma.meeting.findUnique({ where: { id: input.meetingId } });
      if (!meeting) {
        throw new UploadThingError("Meeting not found.");
      }

      return { meetingId: input.meetingId, previousFileKey: meeting.minutesFileKey };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.meeting.update({
        where: { id: metadata.meetingId },
        data: {
          minutesFileName: file.name,
          minutesFilePath: file.ufsUrl,
          minutesFileType: file.type,
          minutesFileKey: file.key,
        },
      });

      // Clean up the file being replaced, if any.
      if (metadata.previousFileKey) {
        await utapi.deleteFiles(metadata.previousFileKey).catch(() => {});
      }

      revalidatePath("/meetings");

      return { meetingId: metadata.meetingId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
