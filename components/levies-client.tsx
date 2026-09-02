"use client";

import { useRef, useState, useTransition } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { addLevy, deleteLevy, editLevyName, toggleLevyPayment } from "@/lib/actions/levies";
import { Modal } from "@/components/ui/modal";

/** A levy's progress bar. Doesn't replay on mount — only animates when its
 * width actually changes (e.g. a payment gets toggled), so revisiting the
 * page doesn't re-trigger a gimmick fill-in every time. */
function LevyProgressBar({ percentWidth }: { percentWidth: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const prevWidth = useRef<string | null>(null);

  useGSAP(
    () => {
      if (prevWidth.current !== null && prevWidth.current !== percentWidth) {
        const mm = gsap.matchMedia();
        mm.add("(prefers-reduced-motion: no-preference)", () => {
          gsap.fromTo(
            barRef.current,
            { width: prevWidth.current! },
            { width: percentWidth, duration: 0.5, ease: "power2.out" }
          );
        });
        prevWidth.current = percentWidth;
        return () => mm.revert();
      }
      prevWidth.current = percentWidth;
    },
    { dependencies: [percentWidth] }
  );

  return (
    <div className="flex-1 h-2.25 bg-agg-track rounded-full overflow-hidden">
      <div ref={barRef} className="h-full bg-agg-gold rounded-full" style={{ width: percentWidth }} />
    </div>
  );
}

export type LevyView = {
  id: string;
  name: string;
  hostName: string | null;
  createdLabel: string;
  progressLabel: string;
  percentWidth: string;
  members: {
    id: string;
    name: string;
    initials: string;
    avatarColor: string;
    paid: boolean;
    isHost: boolean;
  }[];
};

export function LeviesClient({
  levies,
  members,
  canManageLevies,
}: {
  levies: LevyView[];
  members: { id: string; name: string }[];
  canManageLevies: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-5.5">
        <div className="font-display text-2xl agg:text-[30px] text-agg-ink">Levies</div>
        {canManageLevies && (
          <button
            onClick={() => setAddOpen(true)}
            className="bg-agg-forest text-agg-bg border-none py-2.5 px-4.5 rounded-[9px] text-[13.5px] font-bold cursor-pointer"
          >
            + New Levy
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        {levies.length === 0 && (
          <div className="text-agg-muted text-sm">No levies yet.</div>
        )}
        {levies.map((lv) => (
          <LevyCard key={lv.id} levy={lv} canManageLevies={canManageLevies} />
        ))}
      </div>

      {addOpen && <AddLevyModal members={members} onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function LevyCard({ levy, canManageLevies }: { levy: LevyView; canManageLevies: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(levy.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await editLevyName(levy.id, trimmed);
      setEditing(false);
    });
  }

  function handleDelete() {
    startTransition(() => deleteLevy(levy.id));
  }

  function handleToggle(memberId: string, isHost: boolean) {
    if (!canManageLevies || isHost) return;
    startTransition(() => toggleLevyPayment(levy.id, memberId));
  }

  return (
    <div className="bg-white rounded-[14px] border border-agg-card-border p-5">
      {editing && (
        <form onSubmit={handleSaveEdit} className="flex gap-2 mb-3.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 py-2.5 px-3 rounded-lg border border-agg-input-border text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-agg-forest text-white border-none py-2.5 px-3.5 rounded-lg text-[13px] font-bold cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setName(levy.name);
            }}
            className="bg-transparent border border-agg-input-border text-agg-ink py-2.5 px-3.5 rounded-lg text-[13px] font-bold cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {confirmingDelete && (
        <div className="bg-agg-danger-bg border border-agg-danger-border rounded-[10px] p-3 mb-3.5 flex items-center justify-between gap-2.5">
          <span className="text-[13px] text-agg-danger-text">
            Delete &quot;{levy.name}&quot;? This removes all payment records for it.
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="bg-transparent border border-agg-input-border text-agg-ink py-1.5 px-3 rounded-md text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="bg-agg-danger text-white border-none py-1.5 px-3 rounded-md text-xs font-bold cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start gap-3">
        <div onClick={() => setExpanded((v) => !v)} className="cursor-pointer flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <div className="font-display text-xl text-agg-ink">{levy.name}</div>
            <div className="text-[13px] text-agg-muted">
              ₦5,000 per member{levy.hostName ? " (except host)" : ""} · created {levy.createdLabel}
            </div>
          </div>
          {levy.hostName && (
            <div className="text-[13px] text-agg-muted mt-1">
              For <span className="font-semibold text-agg-ink">{levy.hostName}</span> — exempt from paying
            </div>
          )}
          <div className="flex items-center gap-3 mt-3">
            <LevyProgressBar percentWidth={levy.percentWidth} />
            <div className="text-[13px] font-bold text-agg-forest whitespace-nowrap">
              {levy.progressLabel}
            </div>
          </div>
        </div>
        {canManageLevies && (
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="bg-transparent border border-agg-input-border text-agg-ink py-1.5 px-2.5 rounded-md text-xs font-bold cursor-pointer"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="bg-transparent border border-agg-danger text-agg-danger py-1.5 px-2.5 rounded-md text-xs font-bold cursor-pointer"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-4 border-t border-agg-row-border pt-3.5 flex flex-col gap-0.5">
          {levy.members.map((lm) => (
            <div key={lm.id} className="flex items-center justify-between py-2 px-1">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full text-white flex items-center justify-center text-[10.5px] font-extrabold"
                  style={{ background: lm.avatarColor }}
                >
                  {lm.initials}
                </div>
                <div className="text-[13.5px] text-agg-ink font-semibold">{lm.name}</div>
              </div>
              <div
                onClick={() => handleToggle(lm.id, lm.isHost)}
                style={{ cursor: canManageLevies && !lm.isHost ? "pointer" : "default" }}
              >
                <span
                  className="text-xs font-bold py-1 px-2.5 rounded-full"
                  style={
                    lm.isHost
                      ? { background: "#F0E6D4", color: "#8A7A63" }
                      : { background: lm.paid ? "#EBF3EA" : "#FBEAE5", color: lm.paid ? "#3F7A44" : "#B3402A" }
                  }
                >
                  {lm.isHost ? "Exempt (host)" : lm.paid ? "Paid" : "Unpaid"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddLevyModal({
  members,
  onClose,
}: {
  members: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await addLevy(formData);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <Modal onClose={onClose}>
      <form action={handleSubmit}>
        <div className="font-display text-[22px] text-agg-ink mb-4.5">New Levy</div>
        <div className="flex flex-col gap-3">
          <input
            required
            name="name"
            placeholder="Levy name (e.g. Chief Okoro Burial)"
            className="px-3.5 py-2.5 rounded-[9px] border border-agg-input-border text-sm"
          />
          <div className="py-2.5 px-3.5 rounded-[9px] border border-agg-input-border text-sm text-agg-muted bg-agg-row-border">
            Amount per member: ₦5,000 (fixed)
          </div>
          <select
            name="hostId"
            defaultValue=""
            className="px-3.5 py-2.5 rounded-[9px] border border-agg-input-border text-sm bg-white"
          >
            <option value="">No host — everyone pays</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                Honoree: {m.name} (exempt from paying)
              </option>
            ))}
          </select>
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
            Create Levy
          </button>
        </div>
      </form>
    </Modal>
  );
}
