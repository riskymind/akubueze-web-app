"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageLevies, DEFAULT_LEVY_AMOUNT } from "@/lib/constants";

async function requireLevyManager() {
  const session = await getServerSession(authOptions);
  if (!canManageLevies(session?.user.role)) {
    throw new Error("Not authorized to manage levies.");
  }
}

export async function addLevy(formData: FormData) {
  await requireLevyManager();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Levy name is required.");

  const hostIdRaw = String(formData.get("hostId") ?? "").trim();
  const hostId = hostIdRaw || null;
  if (hostId) {
    const host = await prisma.member.findUnique({ where: { id: hostId } });
    if (!host) throw new Error("Selected host is not a valid member.");
  }

  const members = await prisma.member.findMany({ select: { id: true } });
  // The honoree (if any) doesn't pay their own levy.
  const payingMembers = members.filter((m) => m.id !== hostId);

  await prisma.levy.create({
    data: {
      name,
      amount: DEFAULT_LEVY_AMOUNT,
      hostId,
      payments: {
        create: payingMembers.map((m) => ({ memberId: m.id, paid: false })),
      },
    },
  });

  revalidatePath("/levies");
  revalidatePath("/dashboard");
}

export async function editLevyName(levyId: string, name: string) {
  await requireLevyManager();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Levy name is required.");

  await prisma.levy.update({ where: { id: levyId }, data: { name: trimmed } });

  revalidatePath("/levies");
}

export async function deleteLevy(levyId: string) {
  await requireLevyManager();

  await prisma.levy.delete({ where: { id: levyId } });

  revalidatePath("/levies");
  revalidatePath("/dashboard");
}

export async function toggleLevyPayment(levyId: string, memberId: string) {
  await requireLevyManager();

  const levy = await prisma.levy.findUnique({ where: { id: levyId } });
  if (levy?.hostId === memberId) {
    throw new Error("This member is the host of this levy and is exempt from paying it.");
  }

  const existing = await prisma.levyPayment.findUnique({
    where: { levyId_memberId: { levyId, memberId } },
  });

  await prisma.levyPayment.upsert({
    where: { levyId_memberId: { levyId, memberId } },
    create: { levyId, memberId, paid: true },
    update: { paid: !(existing?.paid ?? false) },
  });

  revalidatePath("/levies");
  revalidatePath("/dashboard");
  revalidatePath("/members");
}
