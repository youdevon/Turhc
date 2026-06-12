import type { ReactNode } from "react";
import { LandingV2Scene, type LandingV2SceneTint } from "./LandingV2Scene";
import type { LandingV2SceneVariant, LandingV2SectionContent } from "@/lib/landing-page-v2";
import { cn } from "@/lib/utils";

type Props = {
  section: LandingV2SectionContent;
  className?: string;
  id?: string;
  tint?: LandingV2SceneTint;
  children: ReactNode;
};

export function LandingV2Section({ section, className, id, tint, children }: Props) {
  if (!section.isActive) return null;

  const variant = (section.settings.sceneVariant as LandingV2SceneVariant | undefined) ?? "default";

  return (
    <LandingV2Scene variant={variant} tint={tint} className={cn(className)} id={id}>
      {children}
    </LandingV2Scene>
  );
}
