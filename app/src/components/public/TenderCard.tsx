import { PreviewAwareLink } from "./PreviewAwareLink";
import { Calendar, ArrowRight } from "lucide-react";
import { formatShortDate, formatStatus, getStatusColor, formatCurrency } from "@/lib/utils";

type Props = {
  slug: string;
  referenceNumber: string;
  title: string;
  category: string;
  closingDate: Date | string;
  status: string;
  estimatedValue?: number | string | null;
};

export function TenderCard({
  slug,
  referenceNumber,
  title,
  category,
  closingDate,
  status,
  estimatedValue,
}: Props) {
  return (
    <PreviewAwareLink
      href={`/tenders/${slug}`}
      className="public-content-card card-hover group"
    >
      <div className="public-content-card__body">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-mono text-muted">{referenceNumber}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight ${getStatusColor(status)}`}>
            {formatStatus(status)}
          </span>
        </div>
        <p className="text-[11px] uppercase tracking-wider text-accent">{category}</p>
        <h3 className="public-card-title line-clamp-2 transition-colors group-hover:text-primary">
          {title}
        </h3>
        <div className="flex flex-wrap gap-3 text-sm text-muted">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Closes {formatShortDate(closingDate)}
          </span>
          {estimatedValue != null && <span>{formatCurrency(estimatedValue)}</span>}
        </div>
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary">
          View tender <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </PreviewAwareLink>
  );
}
