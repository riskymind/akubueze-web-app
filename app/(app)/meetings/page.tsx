import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateMeeting, canUploadMinutes } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { MeetingsClient, type MeetingView } from "@/components/meetings-client";

export default async function MeetingsPage() {
  const session = await getServerSession(authOptions);

  const [meetings, members] = await Promise.all([
    prisma.meeting.findMany({ include: { host: true }, orderBy: { date: "asc" } }),
    prisma.member.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
  ]);
  const uploadAllowed = canUploadMinutes(session?.user.role);

  const meetingsView: MeetingView[] = meetings.map((mt) => ({
    id: mt.id,
    label: mt.label,
    dateLabel: fmtDate(mt.date),
    recorded: mt.recorded,
    recordedLabel: mt.recorded ? "Payments recorded" : "Not yet recorded",
    hostName: mt.host.name,
    hasMinutes: !!mt.minutesFileName,
    minutesFileName: mt.minutesFileName,
    minutesFileType: mt.minutesFileType,
    canUpload: uploadAllowed,
  }));

  return (
    <MeetingsClient
      meetings={meetingsView}
      members={members}
      canCreateMeeting={canCreateMeeting(session?.user.role)}
    />
  );
}
