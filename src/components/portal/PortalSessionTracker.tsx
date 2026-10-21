"use client";

import { useEffect } from "react";

export function PortalSessionTracker() {
  useEffect(() => {
    const guestId = window.localStorage.getItem("medical-portfolio-guest-id");
    const role = window.localStorage.getItem("medical-portfolio-role");

    const heartbeat = () => {
      if (role === "user") {
        fetch("/api/portal/heartbeat", { method: "POST", credentials: "include" }).catch(() => null);
      }
    };

    heartbeat();
    const interval = setInterval(heartbeat, 60_000);

    const onLeave = () => {
      const body = JSON.stringify({ guestId: role === "guest" ? guestId : undefined });
      navigator.sendBeacon("/api/portal/logout", new Blob([body], { type: "application/json" }));
    };

    window.addEventListener("beforeunload", onLeave);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, []);

  return null;
}
