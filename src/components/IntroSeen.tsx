"use client";

import { useEffect } from "react";

// Slightly past the intro's longest animation (wordmark: 0.6s delay + 0.9s).
const INTRO_MS = 1600;

/**
 * Hydrated-page bookkeeping for the intro and reveals. Adds `reveal-ready`
 * (arms the hidden reveal state), and once the intro has finished adds
 * `intro-seen` so client-side returns to `/` do not replay it. The session flag
 * covers later full loads.
 */
export function IntroSeen() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    try {
      sessionStorage.setItem("bandland-intro", "1");
    } catch {
      // Storage can be unavailable; the intro then simply plays again.
    }
    const timer = window.setTimeout(() => root.classList.add("intro-seen"), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
