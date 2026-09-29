"use client";

import { useEffect, useState } from "react";

export function useHealth(intervalMs = 30000) {
  const [status, setStatus] = useState<"ready" | "offline">("ready");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) throw new Error("Health check failed");
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }

    check();
    const id = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return status;
}