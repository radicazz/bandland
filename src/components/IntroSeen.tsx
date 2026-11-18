"use client";

import { useEffect } from "react";

/** Remembers for this tab's session that the stage intro has played. */
export function IntroSeen() {
  useEffect(() => {
    try {
      sessionStorage.setItem("bandland-intro", "1");
    } catch {
      // Storage can be unavailable; the intro then simply plays again.
    }
  }, []);
  return null;
}
