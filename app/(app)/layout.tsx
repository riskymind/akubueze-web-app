import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { canRecordPayments } from "@/lib/constants";
import { Shell } from "@/components/shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <Shell user={session.user} canRecordPayments={canRecordPayments(session.user.role)}>
      {children}
    </Shell>
  );
}
