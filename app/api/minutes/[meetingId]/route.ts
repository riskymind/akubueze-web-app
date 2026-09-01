import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

import { authOptions } from "@/lib/auth";
import { canUploadMinutes } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { saveUpload } from "@/lib/upload";

type RouteParams = { params: Promise<{ meetingId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { meetingId } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting?.minutesFilePath) {
    return NextResponse.json({ error: "No minutes on file." }, { status: 404 });
  }

  const fileStat = await stat(meeting.minutesFilePath).catch(() => null);
  if (!fileStat) {
    return NextResponse.json({ error: "File missing on disk." }, { status: 404 });
  }

  const stream = Readable.toWeb(
    createReadStream(meeting.minutesFilePath)
  ) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": meeting.minutesFileType || "application/octet-stream",
      "Content-Length": String(fileStat.size),
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        meeting.minutesFileName || "minutes"
      )}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!canUploadMinutes(session?.user.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { meetingId } = await params;
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const { filePath } = await saveUpload(file);

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      minutesFileName: file.name,
      minutesFilePath: filePath,
      minutesFileType: file.type || "application/octet-stream",
    },
  });

  revalidatePath("/meetings");

  return NextResponse.json({ ok: true });
}
