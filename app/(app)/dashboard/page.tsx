import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AVATAR_COLORS, dueAmountFor } from "@/lib/constants";
import { avatarColorFor, fmtDate, initialsOf, naira } from "@/lib/format";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const firstName = session!.user.name!.split(" ")[0];
  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [members, meetings, levies] = await Promise.all([
    prisma.member.findMany({ include: { dues: true }, orderBy: { createdAt: "asc" } }),
    prisma.meeting.findMany({ orderBy: { date: "asc" } }),
    prisma.levy.findMany({ include: { payments: true }, orderBy: { dateCreated: "asc" } }),
  ]);

  const recordedMeetings = meetings.filter((m) => m.recorded);
  const lastRecordedMeeting = recordedMeetings.at(-1);
  const upcomingMeeting = meetings.find((m) => !m.recorded) ?? meetings.at(-1);

  const dueFor = (member: (typeof members)[number], meetingId: string) =>
    member.dues.find((d) => d.meetingId === meetingId);

  const meetingById = new Map(meetings.map((mt) => [mt.id, mt]));

  let totalDuesCollected = 0;
  for (const m of members) {
    for (const d of m.dues) {
      if (d.paid) {
        const isHost = meetingById.get(d.meetingId)?.hostId === m.id;
        totalDuesCollected += dueAmountFor(isHost, d.late);
      }
    }
  }
  for (const lv of levies) {
    for (const p of lv.payments) {
      if (p.paid) totalDuesCollected += lv.amount;
    }
  }

  const outstandingCount = lastRecordedMeeting
    ? members.filter((m) => !dueFor(m, lastRecordedMeeting.id)?.paid).length
    : 0;

  const recentPayments: {
    memberName: string;
    initials: string;
    avatarColor: string;
    label: string;
    amountLabel: string;
    date: Date;
  }[] = [];
  for (const mt of recordedMeetings) {
    members.forEach((m, i) => {
      const d = dueFor(m, mt.id);
      if (d?.paid) {
        const isHost = mt.hostId === m.id;
        recentPayments.push({
          memberName: m.name,
          initials: initialsOf(m.name),
          avatarColor: avatarColorFor(AVATAR_COLORS, i),
          label: mt.label + (isHost ? " · host" : "") + (d.late ? " · late" : ""),
          amountLabel: naira(dueAmountFor(isHost, d.late)),
          date: mt.date,
        });
      }
    });
  }
  recentPayments.sort((a, b) => b.date.getTime() - a.date.getTime());
  const topRecentPayments = recentPayments.slice(0, 6);

  const levyProgressList = levies.map((lv) => {
    const paidCount = lv.payments.filter((p) => p.paid).length;
    // The honoree (if any) is exempt and doesn't count toward the total.
    const total = members.length - (lv.hostId ? 1 : 0);
    const pct = total ? Math.round((paidCount / total) * 100) : 0;
    return { id: lv.id, name: lv.name, progressLabel: `${paidCount}/${total} paid`, percentWidth: `${pct}%` };
  });

  return (
    <div className="animate-fade-up">
      <div className="flex items-baseline justify-between mb-7">
        <div>
          <div className="font-display text-[24px] agg:text-[34px] text-agg-ink">
            Welcome back, {firstName}
          </div>
          <div className="text-agg-muted text-sm mt-1">{todayLabel}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 agg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Dues Collected" value={naira(totalDuesCollected)} valueClassName="text-agg-forest" />
        <StatCard label="Members" value={String(members.length)} />
        <StatCard
          label={`Outstanding (${lastRecordedMeeting ? lastRecordedMeeting.label.split(" ")[0] : "—"})`}
          value={String(outstandingCount)}
          valueClassName="text-agg-danger"
        />
        <StatCard
          label="Next Meeting"
          value={upcomingMeeting ? upcomingMeeting.label : "—"}
          valueClassName="text-[19px]! leading-tight"
          sub={upcomingMeeting ? fmtDate(upcomingMeeting.date) : ""}
        />
      </div>

      <div className="grid grid-cols-1 agg:grid-cols-[1.3fr_1fr] gap-5">
        <div className="bg-white rounded-[14px] p-5.5 border border-agg-card-border">
          <div className="font-display text-xl text-agg-ink mb-4">Recent Payments</div>
          <div className="flex flex-col gap-0.5">
            {topRecentPayments.length === 0 && (
              <div className="text-agg-muted text-sm py-2">No payments recorded yet.</div>
            )}
            {topRecentPayments.map((ev, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-agg-row-border last:border-b-0"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7.5 h-7.5 rounded-full text-white flex items-center justify-center text-[11px] font-extrabold"
                    style={{ background: ev.avatarColor }}
                  >
                    {ev.initials}
                  </div>
                  <div>
                    <div className="text-[13.5px] text-agg-ink font-semibold">{ev.memberName}</div>
                    <div className="text-xs text-agg-muted">{ev.label}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-agg-forest">{ev.amountLabel}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[14px] p-5.5 border border-agg-card-border">
          <div className="font-display text-xl text-agg-ink mb-4">Levy Collection</div>
          <div className="flex flex-col gap-4">
            {levyProgressList.length === 0 && (
              <div className="text-agg-muted text-sm py-2">No levies yet.</div>
            )}
            {levyProgressList.map((lv) => (
              <div key={lv.id}>
                <div className="flex justify-between text-[13.5px] text-agg-ink font-semibold mb-1.5">
                  <span>{lv.name}</span>
                  <span className="text-agg-muted font-medium">{lv.progressLabel}</span>
                </div>
                <div className="h-2 bg-agg-track rounded-full overflow-hidden">
                  <div
                    className="h-full bg-agg-terracotta rounded-full"
                    style={{ width: lv.percentWidth }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueClassName = "",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div className="bg-white rounded-[14px] p-5 border border-agg-card-border">
      <div className="text-xs text-agg-muted font-bold uppercase tracking-wide">{label}</div>
      <div className={`font-display text-[30px] text-agg-ink mt-2 ${valueClassName}`}>{value}</div>
      {sub && <div className="text-xs text-agg-muted mt-0.5">{sub}</div>}
    </div>
  );
}
