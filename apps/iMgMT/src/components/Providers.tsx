"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--surface-elevated)",
          color: "var(--text)",
          border: "1px solid var(--border)",
        },
      }}
    />
  );
}
