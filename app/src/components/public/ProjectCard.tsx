import { PreviewAwareLink } from "./PreviewAwareLink";
import { MapPin, ArrowRight, Building2, DollarSign } from "lucide-react";
import { formatCurrency, formatStatus, getStatusColor } from "@/lib/utils";
import { ProjectCardImage } from "./ProjectCardImage";

type Props = {
  slug: string;
  title: string;
  sector: string;
  location: string;
  status: string;
  progressPercent: number;
  imageUrl: string;
  imageAlt?: string;
  imageFallbacks?: string[];
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
  summary?: string | null;
  contractor?: string | null;
  contractValue?: string | number | null;
};

export function ProjectCard({
  slug,
  title,
  sector,
  location,
  status,
  progressPercent,
  imageUrl,
  imageAlt,
  imageFallbacks = [],
  imageFocusX,
  imageFocusY,
  imageZoom,
  summary,
  contractor,
  contractValue,
}: Props) {
  return (
    <PreviewAwareLink
      href={`/projects/${slug}`}
      className="project-card project-card-premium public-content-card card-hover group"
    >
      <div className="public-content-card__media public-media-16x9 relative bg-surface">
        <ProjectCardImage
          src={imageUrl}
          alt={imageAlt ?? title}
          fallbacks={imageFallbacks}
          imageFocusX={imageFocusX}
          imageFocusY={imageFocusY}
          imageZoom={imageZoom}
        />
      </div>

      <div className="public-content-card__body">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${getStatusColor(status)}`}
          >
            {formatStatus(status)}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted line-clamp-1">
            {sector}
          </span>
        </div>

        <h3 className="public-card-title text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>

        <p className="project-card__summary text-sm leading-snug text-muted">
          {summary || "\u00A0"}
        </p>

        <p className="flex items-center gap-1.5 text-sm text-muted line-clamp-1">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{location}</span>
        </p>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted">
            <span>Progress</span>
            <span className="font-medium text-foreground">{progressPercent}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {(contractor || contractValue != null) && (
          <div className="grid gap-1.5 border-t border-border/60 pt-2">
            {contractor && (
              <p className="flex items-start gap-2 text-xs text-muted line-clamp-2">
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-foreground-muted">
                    Contractor
                  </span>
                  {contractor}
                </span>
              </p>
            )}
            {contractValue != null && (
              <p className="flex items-start gap-2 text-xs text-muted">
                <DollarSign className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-foreground-muted">
                    Contract Value
                  </span>
                  {formatCurrency(contractValue)}
                </span>
              </p>
            )}
          </div>
        )}

        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
          View details <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </PreviewAwareLink>
  );
}
