"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateMeeting, canRecordPayments } from "@/lib/constants";

export async function addMeeting(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canCreateMeeting(session?.user.role)) {
    throw new Error("Not authorized to create meetings.");
  }

  const label = String(formData.get("label") ?? "").trim();
  const dateRaw = String(formData.get("date") ?? "");
  const hostId = String(formData.get("hostId") ?? "").trim();
  if (!label || !dateRaw) throw new Error("Meeting title and date are required.");
  if (!hostId) throw new Error("Select a host for this meeting.");

  const host = await prisma.member.findUnique({ where: { id: hostId } });
  if (!host) throw new Error("Selected host is not a valid member.");

  await prisma.meeting.create({
    data: { label, date: new Date(dateRaw), recorded: false, hostId },
  });

  revalidatePath("/meetings");
  revalidatePath("/payments");
  revalidatePath("/dashboard");
}

export async function toggleDuesPaid(memberId: string, meetingId: string) {
  const session = await getServerSession(authOptions);
  if (!canRecordPayments(session?.user.role)) {
    throw new Error("Not authorized to record payments.");
  }

  const existing = await prisma.due.findUnique({
    where: { memberId_meetingId: { memberId, meetingId } },
  });

  await prisma.due.upsert({
    where: { memberId_meetingId: { memberId, meetingId } },
    create: { memberId, meetingId, paid: true, late: false },
    update: { paid: !(existing?.paid ?? false) },
  });

  revalidatePath("/payments");
  revalidatePath("/members");
  revalidatePath("/dashboard");
}

export async function toggleDuesLate(memberId: string, meetingId: string) {
  const session = await getServerSession(authOptions);
  if (!canRecordPayments(session?.user.role)) {
    throw new Error("Not authorized to record payments.");
  }

  const existing = await prisma.due.findUnique({
    where: { memberId_meetingId: { memberId, meetingId } },
  });

  await prisma.due.upsert({
    where: { memberId_meetingId: { memberId, meetingId } },
    create: { memberId, meetingId, paid: false, late: true },
    update: { late: !(existing?.late ?? false) },
  });

  revalidatePath("/payments");
  revalidatePath("/members");
  revalidatePath("/dashboard");
}

export async function saveMeetingRecording(meetingId: string) {
  const session = await getServerSession(authOptions);
  if (!canRecordPayments(session?.user.role)) {
    throw new Error("Not authorized to record payments.");
  }

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { recorded: true },
  });

  revalidatePath("/payments");
  revalidatePath("/meetings");
  revalidatePath("/dashboard");
  revalidatePath("/members");
}
