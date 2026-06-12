import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, className }: Props) {
  return (
    <section className={cn("admin-form-section", className)}>
      <div className="space-y-1 pb-1 border-b border-border/60">
        <h3 className="admin-section-title">{title}</h3>
        {description && <p className="admin-section-description">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
