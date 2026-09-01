"use client";

import { useState, useTransition } from "react";

import { addMember, deleteMember } from "@/lib/actions/members";
import { Modal } from "@/components/ui/modal";

export type MemberView = {
  id: string;
  name: string;
  phone: string;
  joinDateLabel: string;
  initials: string;
  avatarColor: string;
  statusLabel: string;
  statusBg: string;
  statusColor: string;
  detail: {
    name: string;
    phone: string;
    joinDateLabel: string;
    initials: string;
    avatarColor: string;
    ledger: { label: string; status: string; bg: string; color: string }[];
    levies: { name: string; status: string; bg: string; color: string }[];
  };
};

export function MembersClient({
  members,
  canManageMembers,
}: {
  members: MemberView[];
  canManageMembers: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const selected = members.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-5.5">
        <div className="font-display text-2xl agg:text-[30px] text-agg-ink">Members</div>
        {canManageMembers && (
          <button
            onClick={() => setAddOpen(true)}
            className="bg-agg-forest text-agg-bg border-none py-2.5 px-4.5 rounded-[9px] text-[13.5px] font-bold cursor-pointer"
          >
            + Add Member
          </button>
        )}
      </div>

      <div className="bg-white rounded-[14px] border border-agg-card-border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] agg:grid-cols-[2fr_1.2fr_1fr_1fr] py-3.5 px-5 bg-agg-card-header text-[11px] font-bold uppercase tracking-wide text-agg-muted">
          <div>Member</div>
          <div className="hidden agg:block">Phone</div>
          <div className="hidden agg:block">Joined</div>
          <div>Status</div>
        </div>
        {members.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelectedId(m.id)}
            className="grid grid-cols-[1fr_auto] agg:grid-cols-[2fr_1.2fr_1fr_1fr] items-center py-3.5 px-5 border-t border-agg-row-border cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8.5 h-8.5 rounded-full text-white flex items-center justify-center text-xs font-extrabold shrink-0"
                style={{ background: m.avatarColor }}
              >
                {m.initials}
              </div>
              <div className="text-sm text-agg-ink font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                {m.name}
              </div>
            </div>
            <div className="hidden agg:block text-[13.5px] text-[#5C4E3D]">{m.phone}</div>
            <div className="hidden agg:block text-[13.5px] text-[#5C4E3D]">{m.joinDateLabel}</div>
            <div>
              <span
                className="text-xs font-bold py-1 px-2.5 rounded-full"
                style={{ background: m.statusBg, color: m.statusColor }}
              >
                {m.statusLabel}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <MemberDetailModal
          member={selected}
          canManageMembers={canManageMembers}
          onClose={() => setSelectedId(null)}
        />
      )}

      {addOpen && <AddMemberModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function MemberDetailModal({
  member,
  canManageMembers,
  onClose,
}: {
  member: MemberView;
  canManageMembers: boolean;
  onClose: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { detail } = member;

  function handleDelete() {
    setDeleteError("");
    startTransition(async () => {
      try {
        await deleteMember(member.id);
        onClose();
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <Modal onClose={onClose} maxWidth="480px">
      <div className="flex items-center gap-3.5 mb-5">
        <div
          className="w-13 h-13 rounded-full text-white flex items-center justify-center text-lg font-extrabold"
          style={{ background: detail.avatarColor }}
        >
          {detail.initials}
        </div>
        <div>
          <div className="font-display text-[22px] text-agg-ink">{detail.name}</div>
          <div className="text-[13px] text-agg-muted">
            {detail.phone} · joined {detail.joinDateLabel}
          </div>
        </div>
      </div>

      <div className="text-xs font-bold uppercase tracking-wide text-agg-muted mb-2.5">
        Dues History
      </div>
      <div className="flex flex-col gap-0.5 mb-5">
        {detail.ledger.length === 0 && (
          <div className="text-agg-muted text-sm py-2">No recorded meetings yet.</div>
        )}
        {detail.ledger.map((ld, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-2.5 border-b border-agg-row-border-2"
          >
            <div className="text-[13.5px] text-agg-ink">{ld.label}</div>
            <span
              className="text-xs font-bold py-1 px-2.5 rounded-full"
              style={{ background: ld.bg, color: ld.color }}
            >
              {ld.status}
            </span>
          </div>
        ))}
      </div>

      <div className="text-xs font-bold uppercase tracking-wide text-agg-muted mb-2.5">Levies</div>
      <div className="flex flex-col gap-0.5 mb-5.5">
        {detail.levies.length === 0 && (
          <div className="text-agg-muted text-sm py-2">No levies yet.</div>
        )}
        {detail.levies.map((lv, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-2.5 border-b border-agg-row-border-2"
          >
            <div className="text-[13.5px] text-agg-ink">{lv.name}</div>
            <span
              className="text-xs font-bold py-1 px-2.5 rounded-full"
              style={{ background: lv.bg, color: lv.color }}
            >
              {lv.status}
            </span>
          </div>
        ))}
      </div>

      {canManageMembers && confirmDelete && (
        <div className="bg-agg-danger-bg border border-agg-danger-border rounded-[10px] p-3.5 mb-3.5">
          <div className="text-[13.5px] text-agg-danger-text mb-2.5">
            Remove {detail.name} as a member? This also clears their levy records.
          </div>
          {deleteError && (
            <div className="text-[13px] text-agg-danger-text font-semibold mb-2.5">{deleteError}</div>
          )}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="flex-1 bg-transparent border border-agg-input-border text-agg-ink py-2.5 rounded-lg text-[13px] font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 bg-agg-danger text-white border-none py-2.5 rounded-lg text-[13px] font-bold cursor-pointer disabled:opacity-60"
            >
              Yes, delete
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2.5">
        <button
          onClick={onClose}
          className="flex-1 bg-agg-forest text-agg-bg border-none py-2.5 rounded-[9px] text-[13.5px] font-bold cursor-pointer"
        >
          Close
        </button>
        {canManageMembers && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="bg-transparent border border-agg-danger text-agg-danger py-2.5 px-4 rounded-[9px] text-[13.5px] font-bold cursor-pointer"
          >
            Delete member
          </button>
        )}
      </div>
    </Modal>
  );
}

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await addMember(formData);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <Modal onClose={onClose}>
      <form action={handleSubmit}>
        <div className="font-display text-[22px] text-agg-ink mb-4.5">Add Member</div>
        <div className="flex flex-col gap-3">
          <input
            required
            name="name"
            placeholder="Full name"
            className="px-3.5 py-2.5 rounded-[9px] border border-agg-input-border text-sm"
          />
          <input
            required
            name="phone"
            placeholder="Phone number"
            className="px-3.5 py-2.5 rounded-[9px] border border-agg-input-border text-sm"
          />
          <input
            required
            name="joinDate"
            type="date"
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-agg-terracotta text-white border-none py-2.5 rounded-[9px] text-[13.5px] font-bold cursor-pointer disabled:opacity-60"
          >
            Add Member
          </button>
        </div>
      </form>
    </Modal>
  );
}
