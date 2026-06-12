import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({ title, description, className }: Props) {
  return (
    <div
      className={cn(
        "border border-dashed border-border bg-surface-elevated/50 px-6 py-14 text-center",
        className
      )}
    >
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted mt-2 max-w-md mx-auto">{description}</p>}
    </div>
  );
}
