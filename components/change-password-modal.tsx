"use client";

import { useState } from "react";

import { changePassword } from "@/lib/actions/account";
import { Modal } from "@/components/ui/modal";

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    const result = await changePassword(current, next, confirm);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="font-display text-[22px] text-agg-ink mb-4.5">Change Password</div>

        {success && (
          <div className="bg-agg-success-bg text-agg-success rounded-[9px] p-3 text-[13.5px] mb-3.5">
            Password updated successfully.
          </div>
        )}

        <div className="flex flex-col gap-3">
          <input
            required
            type="password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="px-3.5 py-2.5 rounded-[9px] border border-agg-input-border text-sm"
          />
          <input
            required
            type="password"
            placeholder="New password (min 6 characters)"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="px-3.5 py-2.5 rounded-[9px] border border-agg-input-border text-sm"
          />
          <input
            required
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="px-3.5 py-2.5 rounded-[9px] border border-agg-input-border text-sm"
          />
        </div>

        {error && <div className="text-agg-danger text-[13px] mt-2.5">{error}</div>}

        <div className="flex gap-2.5 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-transparent border border-agg-input-border text-agg-ink py-2.5 rounded-[9px] text-[13.5px] font-bold cursor-pointer"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-agg-terracotta text-white border-none py-2.5 rounded-[9px] text-[13.5px] font-bold cursor-pointer disabled:opacity-60"
          >
            Update
          </button>
        </div>
      </form>
    </Modal>
  );
}
