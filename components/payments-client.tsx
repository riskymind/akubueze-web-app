"use client";

import { useState, useTransition } from "react";

import { saveMeetingRecording, toggleDuesLate, toggleDuesPaid } from "@/lib/actions/meetings";

type ChecklistRow = {
  memberId: string;
  name: string;
  initials: string;
  avatarColor: string;
  paid: boolean;
  late: boolean;
  isHost: boolean;
  totalLabel: string;
};

export function PaymentsClient({
  meetingPills,
  recordedMeetingIds,
  checklistByMeeting,
}: {
  meetingPills: { id: string; label: string }[];
  recordedMeetingIds: string[];
  checklistByMeeting: Record<string, ChecklistRow[]>;
}) {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const checklist = selectedMeetingId ? checklistByMeeting[selectedMeetingId] : null;
  const alreadyRecorded = selectedMeetingId
    ? recordedMeetingIds.includes(selectedMeetingId)
    : false;

  function handleTogglePaid(memberId: string) {
    if (!selectedMeetingId) return;
    startTransition(() => toggleDuesPaid(memberId, selectedMeetingId));
  }
  function handleToggleLate(memberId: string) {
    if (!selectedMeetingId) return;
    startTransition(() => toggleDuesLate(memberId, selectedMeetingId));
  }
  function handleSave() {
    if (!selectedMeetingId) return;
    startTransition(() => saveMeetingRecording(selectedMeetingId));
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-5.5">
        <div className="font-display text-2xl agg:text-[30px] text-agg-ink">
          Record Meeting Payments
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap mb-5.5">
        {meetingPills.map((mp) => {
          const active = selectedMeetingId === mp.id;
          return (
            <div
              key={mp.id}
              onClick={() => setSelectedMeetingId(mp.id)}
              className="py-2.5 px-4 rounded-[10px] cursor-pointer text-[13.5px] font-bold"
              style={{
                background: active ? "#2F4B3C" : "#fff",
                color: active ? "#F7F1E6" : "#3A2A1E",
                border: `1px solid ${active ? "#2F4B3C" : "#EADFC8"}`,
              }}
            >
              {mp.label}
            </div>
          );
        })}
      </div>

      {checklist && (
        <div className="bg-white rounded-[14px] border border-agg-card-border overflow-hidden">
          <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_1fr] agg:grid-cols-[2fr_1fr_1fr_1fr] py-3.5 px-5 bg-agg-card-header text-[11px] font-bold uppercase tracking-wide text-agg-muted">
            <div>Member</div>
            <div>Paid</div>
            <div>Late</div>
            <div>Total</div>
          </div>
          {checklist.map((row) => (
            <div
              key={row.memberId}
              className="grid grid-cols-[1.6fr_0.8fr_0.8fr_1fr] agg:grid-cols-[2fr_1fr_1fr_1fr] items-center py-3.5 px-5 border-t border-agg-row-border"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7.5 h-7.5 rounded-full text-white flex items-center justify-center text-[11px] font-extrabold shrink-0"
                  style={{ background: row.avatarColor }}
                >
                  {row.initials}
                </div>
                <div className="text-sm text-agg-ink font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                  {row.name}
                </div>
                {row.isHost && (
                  <span className="text-[10px] font-bold uppercase tracking-wide py-0.5 px-1.5 rounded-full bg-agg-nav-active text-agg-gold shrink-0">
                    Host
                  </span>
                )}
              </div>
              <div onClick={() => handleTogglePaid(row.memberId)} className="cursor-pointer">
                <span
                  className="w-5.5 h-5.5 rounded-md inline-flex items-center justify-center text-white text-[13px] border-[1.5px]"
                  style={{
                    background: row.paid ? "#3F7A44" : "transparent",
                    borderColor: row.paid ? "#3F7A44" : "#D8C7A3",
                  }}
                >
                  {row.paid ? "✓" : ""}
                </span>
              </div>
              <div onClick={() => handleToggleLate(row.memberId)} className="cursor-pointer">
                <span
                  className="w-5.5 h-5.5 rounded-md inline-flex items-center justify-center text-white text-[13px] border-[1.5px]"
                  style={{
                    background: row.late ? "#C1622D" : "transparent",
                    borderColor: row.late ? "#C1622D" : "#D8C7A3",
                  }}
                >
                  {row.late ? "✓" : ""}
                </span>
              </div>
              <div className="text-sm font-bold text-agg-forest">{row.totalLabel}</div>
            </div>
          ))}
          <div className="py-4 px-5 border-t border-agg-row-border flex justify-end">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="bg-agg-terracotta text-white border-none py-2.5 px-5 rounded-[9px] text-[13.5px] font-bold cursor-pointer disabled:opacity-60"
            >
              {alreadyRecorded ? "Update Recording" : "Save Recording"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
