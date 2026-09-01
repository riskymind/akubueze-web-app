"use client";

export function Modal({
  onClose,
  children,
  maxWidth = "400px",
  zIndex = 50,
}: {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  zIndex?: number;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[rgba(58,42,30,0.45)] flex items-center justify-center p-6"
      style={{ zIndex }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-agg-modal-bg w-full rounded-2xl p-6 animate-pop-in max-h-[82vh] overflow-y-auto"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}
