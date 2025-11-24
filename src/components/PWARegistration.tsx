"use client";

import { useEffect } from "react";

export default function PWARegistration() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;
      
      // Add event listeners for service worker lifecycle events
      wb.addEventListener("installed", (event: Event) => {
        console.log("Service Worker installed:", event);
      });

      wb.addEventListener("controlling", (event: Event) => {
        console.log("Service Worker controlling:", event);
      });

      wb.addEventListener("activated", (event: Event) => {
        console.log("Service Worker activated:", event);
      });

      // Register the service worker
      wb.register();
    }
  }, []);

  return null;
}
