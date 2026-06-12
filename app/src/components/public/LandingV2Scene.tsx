import { cn } from "@/lib/utils";

export type LandingV2SceneTint = "neutral" | "blue" | "green" | "none";

type Props = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "soft" | "blueprint" | "image-led";
  tint?: LandingV2SceneTint;
  id?: string;
};

export function LandingV2Scene({
  children,
  className,
  variant = "default",
  tint,
  id,
}: Props) {
  return (
    <section
      id={id}
      className={cn(
        "landing-v2__scene section-padding",
        variant === "default" && "bg-background",
        variant === "soft" && "section-surface-soft",
        variant === "blueprint" && "section-surface-soft blueprint-grid",
        variant === "image-led" && "bg-background",
        tint === "blue" && "landing-v2__scene--blue",
        tint === "green" && "landing-v2__scene--green",
        className
      )}
    >
      <div className="container-wide landing-v2__scene-inner">{children}</div>
    </section>
  );
}
