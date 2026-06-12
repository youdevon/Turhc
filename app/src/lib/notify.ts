import toast from "react-hot-toast";

const SUCCESS_DURATION_MS = 5000;
const ERROR_DURATION_MS = 8000;

type NotifyOptions = {
  duration?: number;
};

export function notifySuccess(message: string, options?: NotifyOptions) {
  return toast.success(message, {
    duration: options?.duration ?? SUCCESS_DURATION_MS,
    className: "app-toast app-toast--success",
    ariaProps: { role: "status", "aria-live": "polite" },
  });
}

export function notifyError(message: string, options?: NotifyOptions) {
  return toast.error(message, {
    duration: options?.duration ?? ERROR_DURATION_MS,
    className: "app-toast app-toast--error",
    ariaProps: { role: "alert", "aria-live": "assertive" },
  });
}

export function notifyWarning(message: string, options?: NotifyOptions) {
  return toast(message, {
    duration: options?.duration ?? ERROR_DURATION_MS,
    icon: "⚠",
    className: "app-toast app-toast--warning",
    ariaProps: { role: "alert", "aria-live": "polite" },
  });
}

export function notifyInfo(message: string, options?: NotifyOptions) {
  return toast(message, {
    duration: options?.duration ?? SUCCESS_DURATION_MS,
    icon: "ℹ",
    className: "app-toast app-toast--info",
    ariaProps: { role: "status", "aria-live": "polite" },
  });
}

/** Map server/validation errors to user-friendly copy. */
export function friendlySaveError(
  error: unknown,
  fallback = "Could not save your changes. Please try again."
): string {
  if (!(error instanceof Error)) return fallback;
  const msg = error.message;
  if (msg.includes("Unauthorized") || msg.includes("permission")) {
    return "You do not have permission to perform this action.";
  }
  if (msg.includes("Unique constraint") || msg.includes("slug")) {
    return "That website link is already in use. Please choose a different one.";
  }
  if (msg.includes("still in use") || msg.includes("references")) {
    return msg;
  }
  if (msg.includes("Prisma") || msg.includes("JSON") || msg.includes("Invariant")) {
    return fallback;
  }
  return msg.length < 120 ? msg : fallback;
}
