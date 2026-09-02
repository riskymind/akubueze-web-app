"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

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
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(backdropRef.current, { opacity: 0, duration: 0.2, ease: "power1.out" });
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 16,
        scale: 0.96,
        duration: 0.3,
        ease: "back.out(1.6)",
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <div
      ref={backdropRef}
      onClick={onClose}
      className="fixed inset-0 bg-[rgba(58,42,30,0.45)] flex items-center justify-center p-6"
      style={{ zIndex }}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-agg-modal-bg w-full rounded-2xl p-6 max-h-[82vh] overflow-y-auto"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}
