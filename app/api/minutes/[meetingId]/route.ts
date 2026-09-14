import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { canUploadMinutes } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";

type RouteParams = { params: Promise<{ meetingId: string }> };

// Uploading minutes happens directly against UploadThing (see
// app/api/uploadthing/core.ts, which updates the meeting record once the
// upload completes). This route only handles removing minutes already on file.
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!canUploadMinutes(session?.user.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { meetingId } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  }

  if (meeting.minutesFileKey) {
    await utapi.deleteFiles(meeting.minutesFileKey).catch(() => {});
  }

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      minutesFileName: null,
      minutesFilePath: null,
      minutesFileType: null,
      minutesFileKey: null,
    },
  });

  revalidatePath("/meetings");

  return NextResponse.json({ ok: true });
}
