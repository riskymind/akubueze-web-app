"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { addMeeting, deleteMeeting, updateMeeting } from "@/lib/actions/meetings";
import { Modal } from "@/components/ui/modal";

export type MeetingView = {
  id: string;
  label: string;
  dateISO: string;
  dateLabel: string;
  recorded: boolean;
  recordedLabel: string;
  hostId: string;
  hostName: string;
  hasMinutes: boolean;
  minutesFileName: string | null;
  minutesFileType: string | null;
  canUpload: boolean;
};

export function MeetingsClient({
  meetings,
  members,
  canManageMeetings,
}: {
  meetings: MeetingView[];
  members: { id: string; name: string }[];
  canManageMeetings: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const editing = meetings.find((m) => m.id === editingId) ?? null;
  const viewing = meetings.find((m) => m.id === viewingId) ?? null;

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-5.5">
        <div className="font-display text-2xl agg:text-[30px] text-agg-ink">
          Meetings &amp; Minutes
        </div>
        {canManageMeetings && (
          <button
            onClick={() => setAddOpen(true)}
            className="bg-agg-forest text-agg-bg border-none py-2.5 px-4.5 rounded-[9px] text-[13.5px] font-bold cursor-pointer"
          >
            + New Meeting
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {meetings.length === 0 && <div className="text-agg-muted text-sm">No meetings yet.</div>}
        {meetings.map((mt) => (
          <MeetingRow
            key={mt.id}
            meeting={mt}
            canManageMeetings={canManageMeetings}
            onView={() => setViewingId(mt.id)}
            onEdit={() => setEditingId(mt.id)}
          />
        ))}
      </div>

      {addOpen && <AddMeetingModal members={members} onClose={() => setAddOpen(false)} />}
      {editing && (
        <EditMeetingModal
          meeting={editing}
          members={members}
          onClose={() => setEditingId(null)}
        />
      )}
      {viewing && <MinutesViewerModal meeting={viewing} onClose={() => setViewingId(null)} />}
    </div>
  );
}

function MeetingRow({
  meeting,
  canManageMeetings,
  onView,
  onEdit,
}: {
  meeting: MeetingView;
  canManageMeetings: boolean;
  onView: () => void;
  onEdit: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`/api/minutes/${meeting.id}`, { method: "POST", body: formData });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  async function handleRemoveMinutes() {
    setRemoving(true);
    await fetch(`/api/minutes/${meeting.id}`, { method: "DELETE" });
    setRemoving(false);
    router.refresh();
  }

  function handleDelete() {
    startTransition(() => deleteMeeting(meeting.id));
  }

  return (
    <div className="bg-white rounded-[14px] border border-agg-card-border py-4.5 px-5">
      {confirmingDelete && (
        <div className="bg-agg-danger-bg border border-agg-danger-border rounded-[10px] p-3 mb-3.5 flex items-center justify-between gap-2.5">
          <span className="text-[13px] text-agg-danger-text">
            Delete &quot;{meeting.label}&quot;? This removes its payment records and any uploaded
            minutes.
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

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-agg-ink">{meeting.label}</div>
          <div className="text-[13px] text-agg-muted mt-0.5">
            {meeting.dateLabel} ·{" "}
            <span
              className="font-bold"
              style={{ color: meeting.recorded ? "#3F7A44" : "#B3402A" }}
            >
              {meeting.recordedLabel}
            </span>
          </div>
          <div className="text-[13px] text-agg-muted mt-0.5">
            Hosted by <span className="font-semibold text-agg-ink">{meeting.hostName}</span> · pays ₦5,000
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
          {meeting.hasMinutes && (
            <span
              onClick={onView}
              className="text-[13px] text-agg-forest bg-[#EFF4EE] py-2 px-3 rounded-lg font-semibold cursor-pointer"
            >
              📄 {meeting.minutesFileName} · View
            </span>
          )}
          {meeting.canUpload && meeting.hasMinutes && (
            <button
              type="button"
              onClick={handleRemoveMinutes}
              disabled={removing}
              className="bg-transparent border border-agg-danger text-agg-danger py-2 px-3 rounded-lg text-[13px] font-bold cursor-pointer disabled:opacity-60"
            >
              {removing ? "Removing…" : "Remove minutes"}
            </button>
          )}
          {meeting.canUpload && (
            <label className="bg-agg-terracotta text-white py-2.5 px-3.5 rounded-lg text-[13px] font-bold cursor-pointer">
              {uploading ? "Uploading…" : meeting.hasMinutes ? "Replace minutes" : "Upload minutes"}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          )}
          {canManageMeetings && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="bg-transparent border border-agg-input-border text-agg-ink py-2 px-3 rounded-lg text-[13px] font-bold cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="bg-transparent border border-agg-danger text-agg-danger py-2 px-3 rounded-lg text-[13px] font-bold cursor-pointer"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MinutesViewerModal({
  meeting,
  onClose,
}: {
  meeting: MeetingView;
  onClose: () => void;
}) {
  const src = `/api/minutes/${meeting.id}`;
  const isPdf = meeting.minutesFileType === "application/pdf";
  const isImage = !!meeting.minutesFileType?.startsWith("image/");

  return (
    <Modal onClose={onClose} maxWidth="760px" zIndex={60}>
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="font-display text-[19px] text-agg-ink">{meeting.label} — Minutes</div>
          <div className="text-[12.5px] text-agg-muted">{meeting.minutesFileName}</div>
        </div>
        <button
          onClick={onClose}
          className="bg-agg-forest text-agg-bg border-none py-2 px-3.5 rounded-lg text-[13px] font-bold cursor-pointer"
        >
          Close
        </button>
      </div>
      <div className="rounded-[10px] overflow-hidden bg-white border border-agg-card-border flex items-center justify-center h-[70vh]">
        {isPdf && <embed type="application/pdf" src={src} className="w-full h-full" />}
        {isImage && (
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
        )}
        {!isPdf && !isImage && (
          <a href={src} download={meeting.minutesFileName ?? undefined} className="text-agg-terracotta text-sm font-bold">
            Download {meeting.minutesFileName} to view
          </a>
        )}
      </div>
    </Modal>
  );
}

function MeetingFormFields({
  members,
  defaultLabel,
  defaultDate,
  defaultHostId,
}: {
  members: { id: string; name: string }[];
  defaultLabel?: string;
  defaultDate?: string;
  defaultHostId?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <input
        required
        name="label"
        placeholder="Meeting title"
        defaultValue={defaultLabel}
        className="px-3.5 py-2.5 rounded-[9px] border border-agg-input-border text-sm"
      />
      <input
        required
        name="date"
        type="date"
        defaultValue={defaultDate}
        className="px-3.5 py-2.5 rounded-[9px] border border-agg-input-border text-sm"
      />
      <select
        required
        name="hostId"
        defaultValue={defaultHostId ?? ""}
        className="px-3.5 py-2.5 rounded-[9px] border border-agg-input-border text-sm bg-white"
      >
        <option value="" disabled>
          Select host (pays ₦5,000)…
        </option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function AddMeetingModal({
  members,
  onClose,
}: {
  members: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await addMeeting(formData);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <Modal onClose={onClose}>
      <form action={handleSubmit}>
        <div className="font-display text-[22px] text-agg-ink mb-4.5">New Meeting</div>
        <MeetingFormFields members={members} />
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
            disabled={pending}
            className="flex-1 bg-agg-terracotta text-white border-none py-2.5 rounded-[9px] text-[13.5px] font-bold cursor-pointer disabled:opacity-60"
          >
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditMeetingModal({
  meeting,
  members,
  onClose,
}: {
  meeting: MeetingView;
  members: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateMeeting(meeting.id, formData);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <Modal onClose={onClose}>
      <form action={handleSubmit}>
        <div className="font-display text-[22px] text-agg-ink mb-4.5">Edit Meeting</div>
        <MeetingFormFields
          members={members}
          defaultLabel={meeting.label}
          defaultDate={meeting.dateISO}
          defaultHostId={meeting.hostId}
        />
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
            disabled={pending}
            className="flex-1 bg-agg-terracotta text-white border-none py-2.5 rounded-[9px] text-[13.5px] font-bold cursor-pointer disabled:opacity-60"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
