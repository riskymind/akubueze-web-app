"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * Wraps server-rendered content and, on mount, plays a one-time "arrival"
 * animation over three optional marker classes found anywhere inside it:
 *
 *  - `.reveal-item`  — staggered fade/rise/scale-in, in DOM order.
 *  - `.reveal-bar`   — width animates from 0 to its `data-width` value
 *                      (e.g. `data-width="42%"`).
 *  - `.reveal-count` — text counts up from 0 to its numeric `data-target`,
 *                      formatted per `data-format` ("naira" | "int").
 *
 * The server-rendered content is already the correct final state, so this
 * is purely a decorative replay — safe to skip entirely, which it does
 * under `prefers-reduced-motion: reduce`.
 */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = root.querySelectorAll<HTMLElement>(".reveal-item");
        const bars = root.querySelectorAll<HTMLElement>(".reveal-bar");
        const counts = root.querySelectorAll<HTMLElement>(".reveal-count");

        const tl = gsap.timeline();

        if (items.length) {
          tl.from(items, {
            opacity: 0,
            y: 14,
            scale: 0.97,
            duration: 0.4,
            stagger: 0.06,
            ease: "back.out(1.4)",
          });
        }

        bars.forEach((bar) => {
          const target = bar.dataset.width || "0%";
          tl.fromTo(
            bar,
            { width: "0%" },
            { width: target, duration: 0.6, ease: "power2.out" },
            items.length ? "-=0.2" : 0
          );
        });

        counts.forEach((el) => {
          const target = Number(el.dataset.target || "0");
          const format = el.dataset.format;
          const counter = { val: 0 };
          tl.to(
            counter,
            {
              val: target,
              duration: 0.8,
              ease: "power2.out",
              onUpdate: () => {
                const v = Math.round(counter.val);
                el.textContent = format === "naira" ? "₦" + v.toLocaleString() : String(v);
              },
            },
            items.length ? "-=0.5" : 0
          );
        });
      });

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
