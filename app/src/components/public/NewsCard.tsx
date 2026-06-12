import { PreviewAwareLink } from "./PreviewAwareLink";
import { formatShortDate } from "@/lib/utils";
import { FramedImage } from "./FramedImage";

type Props = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  publishedAt: Date | string | null;
  imageUrl?: string | null;
  imageFocusX?: number;
  imageFocusY?: number;
  imageZoom?: number;
};

export function NewsCard({
  slug,
  title,
  category,
  summary,
  publishedAt,
  imageUrl,
  imageFocusX,
  imageFocusY,
  imageZoom,
}: Props) {
  return (
    <PreviewAwareLink
      href={`/news/${slug}`}
      className="public-content-card card-hover group"
    >
      <div className="public-content-card__media public-media-16x9 bg-surface">
        {imageUrl ? (
          <FramedImage
            src={imageUrl}
            alt={title}
            className="public-media-16x9__img transition-transform duration-500 group-hover:scale-105"
            imageFocusX={imageFocusX}
            imageFocusY={imageFocusY}
            imageZoom={imageZoom}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-surface-elevated to-accent/10" />
        )}
      </div>

      <div className="public-content-card__body">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-accent">{category}</span>
          {publishedAt && (
            <span className="text-[11px] text-muted">· {formatShortDate(publishedAt)}</span>
          )}
        </div>
        <h3 className="public-card-title line-clamp-2 transition-colors group-hover:text-primary">
          {title}
        </h3>
        <p className="public-body-sm line-clamp-2 mt-auto">{summary}</p>
      </div>
    </PreviewAwareLink>
  );
}
