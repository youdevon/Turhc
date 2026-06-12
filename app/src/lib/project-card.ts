import type { Project, MediaAsset } from "@prisma/client";
import {
  getHeroImageFromSettings,
  getProjectImageAlt,
  getProjectImageFallbacks,
  getProjectImageUrl,
} from "./images";
import { getSiteSettings } from "./settings";

type ProjectCardSource = Pick<
  Project,
  | "slug"
  | "title"
  | "sector"
  | "location"
  | "status"
  | "progressPercent"
  | "description"
  | "cardSummary"
  | "featuredImageUrl"
  | "featuredImageAlt"
  | "imageFocusX"
  | "imageFocusY"
  | "imageZoom"
> & {
  contractor?: string | null;
  contractValue?: Project["contractValue"];
  featuredImage?: Pick<MediaAsset, "url"> | null;
};

export async function getProjectsFallbackImage(): Promise<string> {
  const settings = await getSiteSettings();
  return getHeroImageFromSettings(settings, "projects");
}

export function toProjectCardProps(project: ProjectCardSource, fallbackImage: string) {
  const summarySource = project.cardSummary ?? project.description;
  const summary =
    project.cardSummary ??
    (summarySource.length > 180 ? `${summarySource.slice(0, 177)}...` : summarySource);

  const imageUrl = getProjectImageUrl({ ...project, sector: project.sector }, fallbackImage);

  return {
    slug: project.slug,
    title: project.title,
    sector: project.sector,
    location: project.location,
    status: project.status,
    progressPercent: project.progressPercent,
    imageUrl,
    imageAlt: getProjectImageAlt(project),
    imageFallbacks: getProjectImageFallbacks({ ...project, sector: project.sector }, fallbackImage),
    imageFocusX: project.imageFocusX,
    imageFocusY: project.imageFocusY,
    imageZoom: project.imageZoom,
    summary,
    contractor: project.contractor,
    contractValue: project.contractValue?.toString() ?? null,
  };
}
