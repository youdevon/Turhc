import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "success" | "error" | "warning" | "info";

type Props = {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  /** Center content (e.g. page-level error states). */
  centered?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  actions?: React.ReactNode;
};

const ICONS: Record<AlertVariant, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function AlertBanner({
  variant = "info",
  title,
  children,
  className,
  centered = false,
  dismissible = false,
  onDismiss,
  actions,
}: Props) {
  const Icon = ICONS[variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "app-alert",
        `app-alert--${variant}`,
        centered && "app-alert--centered",
        className
      )}
    >
      <Icon className="app-alert__icon shrink-0" aria-hidden="true" />
      <div className="app-alert__body min-w-0 flex-1">
        {title && <p className="app-alert__title">{title}</p>}
        {children && <div className="app-alert__message">{children}</div>}
        {actions && <div className="app-alert__actions">{actions}</div>}
      </div>
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="app-alert__dismiss"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
