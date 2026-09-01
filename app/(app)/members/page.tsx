import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AVATAR_COLORS, ROLE_LABELS, canManageMembers, dueAmountFor } from "@/lib/constants";
import { avatarColorFor, fmtDate, initialsOf, naira } from "@/lib/format";
import { MembersClient, type MemberView } from "@/components/members-client";

export default async function MembersPage() {
  const session = await getServerSession(authOptions);

  const [members, meetings, levies] = await Promise.all([
    prisma.member.findMany({
      include: { dues: true, levyPayments: true, user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.meeting.findMany({ orderBy: { date: "asc" } }),
    prisma.levy.findMany({ orderBy: { dateCreated: "asc" } }),
  ]);

  const recordedMeetings = meetings.filter((m) => m.recorded);

  const membersView: MemberView[] = members.map((m, i) => {
    const dueFor = (meetingId: string) => m.dues.find((d) => d.meetingId === meetingId);
    const owed = recordedMeetings.reduce((sum, mt) => {
      if (dueFor(mt.id)?.paid) return sum;
      return sum + dueAmountFor(mt.hostId === m.id, false);
    }, 0);
    const avatarColor = avatarColorFor(AVATAR_COLORS, i);
    const roleLabel = m.user ? ROLE_LABELS[m.user.role] : null;

    return {
      id: m.id,
      name: m.name + (roleLabel ? ` · ${roleLabel}` : ""),
      phone: m.phone,
      joinDateLabel: fmtDate(m.joinDate),
      initials: initialsOf(m.name),
      avatarColor,
      statusLabel: owed > 0 ? `Owes ${naira(owed)}` : "Up to date",
      statusBg: owed > 0 ? "#FBEAE5" : "#EBF3EA",
      statusColor: owed > 0 ? "#B3402A" : "#3F7A44",
      detail: {
        name: m.name,
        phone: m.phone,
        joinDateLabel: fmtDate(m.joinDate),
        initials: initialsOf(m.name),
        avatarColor,
        ledger: recordedMeetings.map((mt) => {
          const d = dueFor(mt.id);
          const paid = !!d?.paid;
          const isHost = mt.hostId === m.id;
          return {
            label: mt.label + (isHost ? " (host)" : "") + (d?.late ? " (late)" : ""),
            status: paid ? naira(dueAmountFor(isHost, !!d?.late)) : "Unpaid",
            bg: paid ? "#EBF3EA" : "#FBEAE5",
            color: paid ? "#3F7A44" : "#B3402A",
          };
        }),
        levies: levies.map((lv) => {
          if (lv.hostId === m.id) {
            return { name: lv.name, status: "Exempt (host)", bg: "#F0E6D4", color: "#8A7A63" };
          }
          const paid = !!m.levyPayments.find((p) => p.levyId === lv.id)?.paid;
          return {
            name: lv.name,
            status: paid ? "Paid" : "Unpaid",
            bg: paid ? "#EBF3EA" : "#FBEAE5",
            color: paid ? "#3F7A44" : "#B3402A",
          };
        }),
      },
    };
  });

  return (
    <MembersClient
      members={membersView}
      canManageMembers={canManageMembers(session?.user.role)}
    />
  );
}
