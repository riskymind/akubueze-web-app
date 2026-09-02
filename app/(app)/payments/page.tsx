import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AVATAR_COLORS, canRecordPayments, dueAmountFor } from "@/lib/constants";
import { avatarColorFor, initialsOf, naira } from "@/lib/format";
import { PaymentsClient } from "@/components/payments-client";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!canRecordPayments(session?.user.role)) redirect("/dashboard");

  const [meetings, members] = await Promise.all([
    prisma.meeting.findMany({ orderBy: { date: "asc" } }),
    prisma.member.findMany({ include: { dues: true }, orderBy: { joinDate: "asc" } }),
  ]);

  const meetingPills = meetings.map((mt) => ({
    id: mt.id,
    label: mt.label + (mt.recorded ? "" : " · new"),
  }));

  const checklistByMeeting: Record<
    string,
    {
      memberId: string;
      name: string;
      initials: string;
      avatarColor: string;
      paid: boolean;
      late: boolean;
      isHost: boolean;
      totalLabel: string;
    }[]
  > = {};

  for (const mt of meetings) {
    checklistByMeeting[mt.id] = members.map((m, i) => {
      const d = m.dues.find((x) => x.meetingId === mt.id);
      const paid = d?.paid ?? false;
      const late = d?.late ?? false;
      const isHost = mt.hostId === m.id;
      return {
        memberId: m.id,
        name: m.name,
        initials: initialsOf(m.name),
        avatarColor: avatarColorFor(AVATAR_COLORS, i),
        paid,
        late,
        isHost,
        totalLabel: paid ? naira(dueAmountFor(isHost, late)) : "—",
      };
    });
  }

  return (
    <PaymentsClient
      meetingPills={meetingPills}
      recordedMeetingIds={meetings.filter((m) => m.recorded).map((m) => m.id)}
      checklistByMeeting={checklistByMeeting}
    />
  );
}
