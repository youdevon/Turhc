"use client";

import { useEffect, useRef } from "react";

/**
 * Plays a very soft click on interactive elements. Respects reduced-motion preference.
 */
export function UiSoundProvider() {
  const ctxRef = useRef<AudioContext | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedRef.current = e.matches;
    };
    mq.addEventListener("change", onChange);

    function playClick() {
      if (reducedRef.current) return;
      try {
        if (!ctxRef.current) {
          ctxRef.current = new AudioContext();
        }
        const ctx = ctxRef.current;
        if (ctx.state === "suspended") void ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.018, ctx.currentTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.07);
      } catch {
        // Audio not available — silent fallback
      }
    }

    let last = 0;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest(
        "a[href], button:not([disabled]), [role='button']:not([aria-disabled='true']), input[type='submit'], input[type='button']"
      );
      if (!interactive) return;
      if (interactive.closest("[data-no-ui-sound]")) return;
      const now = Date.now();
      if (now - last < 60) return;
      last = now;
      playClick();
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      mq.removeEventListener("change", onChange);
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return null;
}
