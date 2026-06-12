import { notFound } from "next/navigation";
import { PageHero } from "@/components/public/PageHero";
import { getProjectForPreview } from "@/lib/content-preview";
import { getProjectsFallbackImage } from "@/lib/project-card";
import { getProjectImageUrl, getProjectImageAlt } from "@/lib/images";
type Props = { params: Promise<{ slug: string }> };

export default async function PreviewProjectPage({ params }: Props) {
  const { slug } = await params;
  const [project, fallbackImage] = await Promise.all([
    getProjectForPreview(slug),
    getProjectsFallbackImage(),
  ]);
  if (!project) notFound();

  return (
    <>
      <PageHero
        eyebrow={project.sector}
        title={project.title}
        subtitle={project.cardSummary ?? project.location}
        imageUrl={getProjectImageUrl(project, fallbackImage)}
        imageAlt={getProjectImageAlt(project)}
      />
      <section className="section-padding">
        <div className="container-narrow">
          <p className="whitespace-pre-wrap text-foreground-muted leading-relaxed">{project.description}</p>
        </div>
      </section>
    </>
  );
}
