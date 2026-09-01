"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { Role } from "@prisma/client";

import { ROLE_LABELS } from "@/lib/constants";
import { initialsOf } from "@/lib/format";
import { ChangePasswordModal } from "@/components/change-password-modal";

const SIDEBAR_PATTERN =
  "repeating-linear-gradient(135deg, rgba(217,164,65,0.06) 0px, rgba(217,164,65,0.06) 2px, transparent 2px, transparent 18px)";

type NavItem = { href: string; label: string; icon: string };

function navItems(canRecordPayments: boolean): NavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", icon: "⌂" },
    { href: "/members", label: "Members", icon: "☰" },
    ...(canRecordPayments
      ? [{ href: "/payments", label: "Record Payments", icon: "₦" }]
      : []),
    { href: "/levies", label: "Levies", icon: "◆" },
    { href: "/meetings", label: "Meetings & Minutes", icon: "▤" },
  ];
}

export function Shell({
  user,
  canRecordPayments,
  children,
}: {
  user: { name?: string | null; role: Role };
  canRecordPayments: boolean;
  children: React.ReactNode;
}) {
  const displayName = user.name || "Officer";
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-agg-bg">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-[rgba(34,54,42,0.5)] z-44 agg:hidden"
        />
      )}

      <div
        className={`fixed agg:static top-0 left-0 h-screen agg:h-auto w-63 max-w-[82vw] shrink-0 bg-agg-sidebar flex flex-col py-7 px-4.5 z-45 shadow-[0_0_40px_rgba(0,0,0,0.35)] agg:shadow-none agg:translate-x-0 transition-transform duration-250 ease-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-[-110%]"
        }`}
        style={{ backgroundImage: SIDEBAR_PATTERN }}
      >
        <div className="px-2 pb-6 border-b border-agg-sidebar-border mb-5">
          <div className="font-display italic text-[26px] text-agg-sidebar-text leading-tight">
            Akụbueze
          </div>
          <div className="text-[11px] tracking-[1.5px] uppercase text-agg-gold mt-1 font-bold">
            Age Grade Association
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          {navItems(canRecordPayments).map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5 py-2.5 px-3 rounded-[9px] text-sm font-semibold cursor-pointer"
                style={{
                  background: active ? "rgba(217,164,65,0.16)" : "transparent",
                  color: active ? "#D9A441" : "#E7DEC9",
                }}
              >
                <span className="text-base">{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </div>

        <div className="border-t border-agg-sidebar-border pt-4 mt-3">
          <div className="flex items-center gap-2.5 pb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-agg-gold text-agg-sidebar flex items-center justify-center font-extrabold text-sm shrink-0">
              {initialsOf(displayName)}
            </div>
            <div className="min-w-0">
              <div className="text-agg-sidebar-text text-[13px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                {displayName}
              </div>
              <div className="text-agg-sidebar-muted text-[11px] capitalize">
                {ROLE_LABELS[user.role]}
              </div>
            </div>
          </div>
          <button
            onClick={() => setChangePasswordOpen(true)}
            className="w-full bg-transparent border border-[rgba(247,241,230,0.25)] text-agg-sidebar-text py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer mb-2"
          >
            Change password
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-transparent border border-[rgba(247,241,230,0.25)] text-agg-sidebar-text py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex agg:hidden items-center gap-3.5 py-3.5 px-4 bg-agg-sidebar">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="bg-transparent border border-[rgba(247,241,230,0.3)] text-agg-sidebar-text w-9.5 h-9.5 rounded-lg text-lg cursor-pointer"
          >
            ☰
          </button>
          <div className="font-display italic text-[19px] text-agg-sidebar-text">Akụbueze</div>
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto p-5 agg:p-9">{children}</div>
      </div>

      {changePasswordOpen && (
        <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />
      )}
    </div>
  );
}
