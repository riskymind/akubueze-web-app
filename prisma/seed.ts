import "dotenv/config";

import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

// Ported 1:1 from the original design's mock data (INITIAL_MEMBERS / INITIAL_MEETINGS / INITIAL_LEVIES).

const OFFICERS = [
  { key: "mem0a", username: "chairman", password: "chair2026", name: "Eze Nnamdi Okonkwo", role: Role.CHAIRMAN, phone: "0801 234 5678", joinDate: "2017-01-20" },
  { key: "mem0b", username: "finsec", password: "finsec2026", name: "Adaeze Umeh", role: Role.FINSEC, phone: "0802 234 5678", joinDate: "2018-05-11" },
  { key: "mem0c", username: "secretary", password: "sec2026", name: "Chidibuike Obinna", role: Role.SECRETARY, phone: "0804 234 5678", joinDate: "2018-09-02" },
];

const REGULAR_MEMBERS = [
  { key: "mem1", name: "Chukwuemeka Okafor", phone: "0803 123 4567", joinDate: "2019-03-10" },
  { key: "mem2", name: "Ifeanyi Nwosu", phone: "0805 123 4567", joinDate: "2019-03-10" },
  { key: "mem3", name: "Obiora Eze", phone: "0806 123 4567", joinDate: "2020-01-15" },
  { key: "mem4", name: "Kelechi Umeadi", phone: "0807 123 4567", joinDate: "2020-01-15" },
  { key: "mem5", name: "Nnaemeka Ibe", phone: "0808 123 4567", joinDate: "2021-06-05" },
  { key: "mem6", name: "Chinedu Anyaegbunam", phone: "0809 123 4567", joinDate: "2021-06-05" },
  { key: "mem7", name: "Ugochukwu Madu", phone: "0702 123 4567", joinDate: "2022-02-20" },
  { key: "mem8", name: "Emeka Okoli", phone: "0703 123 4567", joinDate: "2023-04-12" },
];

const MEETINGS = [
  { key: "m1", label: "March General Meeting", date: "2026-03-08", recorded: true, hostKey: "mem1" },
  { key: "m2", label: "April General Meeting", date: "2026-04-12", recorded: true, hostKey: "mem2" },
  { key: "m3", label: "May General Meeting", date: "2026-05-10", recorded: true, hostKey: "mem3" },
  { key: "m4", label: "September General Meeting", date: "2026-09-13", recorded: false, hostKey: "mem4" },
];

// dues[memberKey][meetingKey] = { paid, late }
const DUES: Record<string, Record<string, { paid: boolean; late: boolean }>> = {
  mem0a: { m1: { paid: true, late: false }, m2: { paid: true, late: false }, m3: { paid: true, late: false } },
  mem0b: { m1: { paid: true, late: false }, m2: { paid: true, late: false }, m3: { paid: true, late: false } },
  mem0c: { m1: { paid: true, late: false }, m2: { paid: true, late: false }, m3: { paid: true, late: false } },
  mem1: { m1: { paid: true, late: false }, m2: { paid: true, late: false }, m3: { paid: true, late: false } },
  mem2: { m1: { paid: true, late: false }, m2: { paid: true, late: false }, m3: { paid: true, late: false } },
  mem3: { m1: { paid: true, late: false }, m2: { paid: true, late: false }, m3: { paid: true, late: true } },
  mem4: { m1: { paid: true, late: false }, m2: { paid: true, late: true }, m3: { paid: true, late: false } },
  mem5: { m1: { paid: true, late: false }, m2: { paid: true, late: false }, m3: { paid: false, late: false } },
  mem6: { m1: { paid: true, late: false }, m2: { paid: true, late: false }, m3: { paid: false, late: false } },
  mem7: { m1: { paid: true, late: false }, m2: { paid: false, late: false }, m3: { paid: true, late: false } },
  mem8: { m1: { paid: true, late: true }, m2: { paid: true, late: false }, m3: { paid: true, late: false } },
};

const LEVIES = [
  {
    key: "lv1",
    name: "Chief Okoro Burial Levy",
    dateCreated: "2026-04-20",
    payments: { mem0a: true, mem0b: true, mem0c: true, mem1: true, mem2: true, mem3: true, mem4: true, mem5: true, mem6: true, mem7: false, mem8: false },
  },
  {
    key: "lv2",
    name: "Ndubuisi Wedding Levy",
    dateCreated: "2026-06-01",
    payments: { mem0a: true, mem0b: true, mem0c: true, mem1: true, mem2: true, mem3: true, mem4: true, mem5: false, mem6: false, mem7: false, mem8: false },
  },
];

async function main() {
  console.log("Seeding database…");

  const memberIdByKey: Record<string, string> = {};

  for (const officer of OFFICERS) {
    const member = await prisma.member.create({
      data: { name: officer.name, phone: officer.phone, joinDate: new Date(officer.joinDate) },
    });
    memberIdByKey[officer.key] = member.id;

    const passwordHash = await bcrypt.hash(officer.password, 10);
    await prisma.user.create({
      data: {
        username: officer.username,
        passwordHash,
        name: officer.name,
        role: officer.role,
        memberId: member.id,
      },
    });
  }

  for (const m of REGULAR_MEMBERS) {
    const member = await prisma.member.create({
      data: { name: m.name, phone: m.phone, joinDate: new Date(m.joinDate) },
    });
    memberIdByKey[m.key] = member.id;
  }

  const meetingIdByKey: Record<string, string> = {};
  for (const mt of MEETINGS) {
    const meeting = await prisma.meeting.create({
      data: {
        label: mt.label,
        date: new Date(mt.date),
        recorded: mt.recorded,
        hostId: memberIdByKey[mt.hostKey],
      },
    });
    meetingIdByKey[mt.key] = meeting.id;
  }

  for (const [memberKey, byMeeting] of Object.entries(DUES)) {
    for (const [meetingKey, due] of Object.entries(byMeeting)) {
      await prisma.due.create({
        data: {
          memberId: memberIdByKey[memberKey],
          meetingId: meetingIdByKey[meetingKey],
          paid: due.paid,
          late: due.late,
        },
      });
    }
  }

  for (const lv of LEVIES) {
    await prisma.levy.create({
      data: {
        name: lv.name,
        dateCreated: new Date(lv.dateCreated),
        payments: {
          create: Object.entries(lv.payments).map(([memberKey, paid]) => ({
            memberId: memberIdByKey[memberKey],
            paid,
          })),
        },
      },
    });
  }

  // Read-only viewer account: dashboard, members, levies, meetings — no
  // record-payments, manage, create, or upload permissions. Not tied to a
  // specific Member row.
  await prisma.user.create({
    data: {
      username: "member",
      passwordHash: await bcrypt.hash("member2026", 10),
      name: "Member",
      role: Role.MEMBER,
    },
  });

  console.log("Seed complete.");
  console.log(
    "Demo logins: chairman/chair2026, finsec/finsec2026, secretary/sec2026, member/member2026"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
