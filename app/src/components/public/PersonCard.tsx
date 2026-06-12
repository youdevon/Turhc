import { memberPhotoStyle } from "@/lib/photo-framing";

type Props = {
  name: string;
  title: string;
  department?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  photoFocusX?: number;
  photoFocusY?: number;
  photoZoom?: number;
  variant?: "primary" | "accent";
};

export function PersonCard({
  name,
  title,
  photoUrl,
  photoFocusX,
  photoFocusY,
  photoZoom,
  variant = "primary",
}: Props) {
  const fallbackBg = variant === "accent" ? "bg-accent/10" : "bg-primary/10";
  const fallbackText = variant === "accent" ? "text-accent" : "text-primary";

  return (
    <article className="public-content-card public-content-card--person card-hover w-full">
      <div className="public-content-card__media public-media-portrait bg-surface">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            className="public-media-portrait__img"
            style={memberPhotoStyle(photoFocusX, photoFocusY, photoZoom)}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center ${fallbackBg} public-display-serif text-2xl font-bold ${fallbackText}`}
          >
            {name[0]}
          </div>
        )}
      </div>

      <div className="public-content-card__body">
        <h3 className="public-person-name">{name}</h3>
        <p className="public-person-role">{title}</p>
      </div>
    </article>
  );
}
