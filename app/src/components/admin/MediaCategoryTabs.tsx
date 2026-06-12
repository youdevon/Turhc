import Link from "next/link";
import { cn } from "@/lib/utils";
import { MEDIA_CATEGORY_TABS, type MediaCategory } from "@/lib/media-utils";

type Props = {
  active: MediaCategory;
  counts: Record<MediaCategory, number>;
};

export function MediaCategoryTabs({ active, counts }: Props) {
  return (
    <div className="admin-actions">
      {MEDIA_CATEGORY_TABS.map((tab) => {
        const selected = active === tab.id;
        const count = counts[tab.id];

        return (
          <Link
            key={tab.id}
            href={tab.id === "all" ? "/admin/media" : `/admin/media?category=${tab.id}`}
            className={cn("admin-btn-toggle", selected && "admin-btn-toggle--active")}
          >
            {tab.label}
            <span
              className={cn(
                "admin-count-badge",
                selected ? "admin-count-badge--active" : "admin-count-badge--muted"
              )}
            >
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
