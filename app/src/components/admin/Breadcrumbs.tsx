import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Props = {
  items: { label: string; href?: string }[];
};

export function Breadcrumbs({ items }: Props) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted">
      <Link href="/admin/dashboard" className="hover:text-primary transition-colors">Admin Panel</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          {item.href ? (
            <Link href={item.href} className="hover:text-primary transition-colors">{item.label}</Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
