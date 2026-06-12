import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@prisma/client";
import { PageHero } from "@/components/public/PageHero";
import { ProjectCard } from "@/components/public/ProjectCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getPageHeroBySlug } from "@/lib/page-hero";
import { getProjectsFallbackImage, toProjectCardProps } from "@/lib/project-card";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const [projects, hero, projectsFallbackImage] = await Promise.all([
    prisma.project.findMany({
      where: { statusContent: ContentStatus.PUBLISHED },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      include: { featuredImage: true },
    }),
    getPageHeroBySlug("projects"),
    getProjectsFallbackImage(),
  ]);

  return (
    <>
      <PageHero {...hero} />
      <section className="section-padding blueprint-grid">
        <div className="container-wide">
          <div className="public-content-grid">
            {projects.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 0.03} className="h-full">
                <ProjectCard {...toProjectCardProps(p, projectsFallbackImage)} />
              </ScrollReveal>
            ))}
          </div>
          {projects.length === 0 && (
            <p className="text-center text-muted py-12">No projects published yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
