"use client";

import { useEffect, useCallback } from "react";

interface Props {
  onSearchOpen: () => void;
}

export function KeyboardShortcuts({ onSearchOpen }: Props) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onSearchOpen();
      }
    },
    [onSearchOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);

  return null;
}
