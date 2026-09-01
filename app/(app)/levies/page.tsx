import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AVATAR_COLORS, canManageLevies } from "@/lib/constants";
import { avatarColorFor, fmtDate, initialsOf } from "@/lib/format";
import { LeviesClient, type LevyView } from "@/components/levies-client";

export default async function LeviesPage() {
  const session = await getServerSession(authOptions);

  const [levies, members] = await Promise.all([
    prisma.levy.findMany({
      include: { payments: true, host: true },
      orderBy: { dateCreated: "asc" },
    }),
    prisma.member.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const leviesView: LevyView[] = levies.map((lv) => {
    const paidCount = lv.payments.filter((p) => p.paid).length;
    // The honoree (if any) is exempt and doesn't count toward the total.
    const total = members.length - (lv.hostId ? 1 : 0);
    const pct = total ? Math.round((paidCount / total) * 100) : 0;

    return {
      id: lv.id,
      name: lv.name,
      hostName: lv.host?.name ?? null,
      createdLabel: fmtDate(lv.dateCreated),
      progressLabel: `${paidCount}/${total} paid`,
      percentWidth: `${pct}%`,
      members: members.map((m, i) => {
        const isHost = lv.hostId === m.id;
        const paid = !!lv.payments.find((p) => p.memberId === m.id)?.paid;
        return {
          id: m.id,
          name: m.name,
          initials: initialsOf(m.name),
          avatarColor: avatarColorFor(AVATAR_COLORS, i),
          paid,
          isHost,
        };
      }),
    };
  });

  return (
    <LeviesClient
      levies={leviesView}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
      canManageLevies={canManageLevies(session?.user.role)}
    />
  );
}
