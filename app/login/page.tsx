"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@prisma/client";

import { ROLE_LABELS, ROLE_OPTIONS } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("CHAIRMAN");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await signIn("credentials", {
      role,
      username,
      password,
      redirect: false,
    });
    setSubmitting(false);
    if (res?.error) {
      setError("Incorrect username or password for this role.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen bg-agg-sidebar flex items-center justify-center p-6"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, rgba(217,164,65,0.07) 0px, rgba(217,164,65,0.07) 2px, transparent 2px, transparent 20px)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-agg-modal-bg w-full max-w-[400px] rounded-[18px] px-7 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-pop-in"
      >
        <div className="text-center mb-6">
          <div className="font-display italic text-[30px] text-agg-sidebar">Akụbueze</div>
          <div className="text-[11px] tracking-[1.5px] uppercase text-agg-terracotta mt-1 font-bold">
            Age Grade Association
          </div>
          <div className="text-[13px] text-agg-muted mt-2.5">Sign in to continue</div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-agg-track p-1.5 rounded-[11px] mb-4.5">
          {ROLE_OPTIONS.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className="text-center py-2.5 px-1 rounded-lg text-[12.5px] font-bold cursor-pointer transition-colors"
              style={{
                background: role === r ? "#2F4B3C" : "transparent",
                color: role === r ? "#F7F1E6" : "#5C4E3D",
              }}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-3.5 py-3 rounded-[9px] border border-agg-input-border text-sm"
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3.5 py-3 rounded-[9px] border border-agg-input-border text-sm"
          />
        </div>

        {error && <div className="text-agg-danger text-[13px] mt-2.5">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-4.5 bg-agg-terracotta text-white border-none py-3.5 rounded-[9px] text-[14.5px] font-bold cursor-pointer disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
