"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerClassName="app-toast-container"
      toastOptions={{
        className: "app-toast",
        style: {
          background: "var(--toast-bg)",
          color: "var(--text)",
          border: "1px solid var(--toast-border)",
          boxShadow: "var(--shadow-card)",
          fontSize: "0.875rem",
          lineHeight: "1.4",
          maxWidth: "24rem",
        },
        success: {
          duration: 5000,
          className: "app-toast app-toast--success",
          iconTheme: {
            primary: "var(--alert-success-icon)",
            secondary: "var(--alert-success-icon-bg)",
          },
        },
        error: {
          duration: 8000,
          className: "app-toast app-toast--error",
          iconTheme: {
            primary: "var(--alert-error-icon)",
            secondary: "var(--alert-error-icon-bg)",
          },
        },
      }}
    />
  );
}
