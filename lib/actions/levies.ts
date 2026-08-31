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

  const members = await prisma.member.findMany({ select: { id: true } });

  await prisma.levy.create({
    data: {
      name,
      amount: DEFAULT_LEVY_AMOUNT,
      payments: {
        create: members.map((m) => ({ memberId: m.id, paid: false })),
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
