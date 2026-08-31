"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageMembers } from "@/lib/constants";

export async function addMember(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!canManageMembers(session?.user.role)) {
    throw new Error("Not authorized to add members.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const joinDateRaw = String(formData.get("joinDate") ?? "");
  if (!name || !phone) throw new Error("Name and phone are required.");

  await prisma.member.create({
    data: {
      name,
      phone,
      joinDate: joinDateRaw ? new Date(joinDateRaw) : new Date(),
    },
  });

  revalidatePath("/members");
  revalidatePath("/dashboard");
  revalidatePath("/payments");
  revalidatePath("/levies");
}

export async function deleteMember(memberId: string) {
  const session = await getServerSession(authOptions);
  if (!canManageMembers(session?.user.role)) {
    throw new Error("Not authorized to delete members.");
  }

  await prisma.member.delete({ where: { id: memberId } });

  revalidatePath("/members");
  revalidatePath("/dashboard");
  revalidatePath("/payments");
  revalidatePath("/levies");
}
