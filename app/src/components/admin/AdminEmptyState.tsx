import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function AdminEmptyState({ title, description, actionLabel, actionHref, className }: Props) {
  return (
    <div
      className={cn(
        "admin-card px-6 py-14 md:py-16 text-center border-dashed border-border",
        className
      )}
    >
      <p className="font-medium text-foreground text-base">{title}</p>
      {description && (
        <p className="text-sm text-muted mt-2 max-w-md mx-auto leading-relaxed">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="admin-btn-primary mt-6 inline-flex">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
