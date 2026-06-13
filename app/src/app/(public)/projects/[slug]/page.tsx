import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Calendar, Building, DollarSign } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { getProjectBySlug } from "@/lib/data";
import { formatCurrency, formatDate, formatStatus, getStatusColor } from "@/lib/utils";
import { NewsCard } from "@/components/public/NewsCard";
import { getProjectsFallbackImage } from "@/lib/project-card";
import { getProjectImageUrl, getProjectImageAlt } from "@/lib/images";
import { sanitizePublicHtml } from "@/lib/sanitize-html";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return { title: project?.title ?? "Project" };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const [project, fallbackImage] = await Promise.all([
    getProjectBySlug(slug),
    getProjectsFallbackImage(),
  ]);
  if (!project) notFound();

  const imageUrl = getProjectImageUrl(project, fallbackImage);
  const imageAlt = getProjectImageAlt(project);

  return (
    <>
      <PageHero
        eyebrow={project.sector}
        title={project.title}
        subtitle={project.cardSummary ?? project.location}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        imageFocusX={project.imageFocusX}
        imageFocusY={project.imageFocusY}
        imageZoom={project.imageZoom}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.title },
        ]}
      />

      <section className="section-padding">
        <div className="container-wide grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {formatStatus(project.status)}
              </span>
              <p className="flex items-center gap-2 text-muted text-sm">
                <MapPin className="w-4 h-4" /> {project.location}
              </p>
            </div>

            <div
              className="prose-dark"
              dangerouslySetInnerHTML={{ __html: sanitizePublicHtml(project.description) }}
            />

            {project.images.length > 0 && (
              <div>
                <h2 className="public-content-heading">Gallery</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {project.images.map((img) => (
                    <div key={img.id} className="public-media-16x9 border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.media.url} alt={img.caption ?? project.title} className="public-media-16x9__img" />
                      {img.caption && <p className="p-3 text-sm text-muted">{img.caption}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.milestones.length > 0 && (
              <div>
                <h2 className="public-content-heading">Timeline</h2>
                <div className="space-y-4">
                  {project.milestones.map((m, i) => (
                    <div key={m.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${m.completedAt ? "bg-emerald-500" : "bg-primary"}`} />
                        {i < project.milestones.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                      </div>
                      <div className="pb-4">
                        <h3 className="font-medium">{m.title}</h3>
                        {m.description && <p className="text-sm text-muted">{m.description}</p>}
                        {m.targetDate && <p className="text-xs text-muted mt-1">{formatDate(m.targetDate)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="border border-border bg-surface-elevated p-6 space-y-4">
              <h3 className="public-panel-heading">Project Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Progress</span>
                  <span className="font-medium">{project.progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${project.progressPercent}%` }} />
                </div>
                {project.contractor && (
                  <div className="flex items-start gap-2">
                    <Building className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <span className="text-muted block">Contractor</span>
                      {project.contractor}
                    </div>
                  </div>
                )}
                {project.contractValue != null && (
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <span className="text-muted block">Contract Value</span>
                      {formatCurrency(project.contractValue.toString())}
                    </div>
                  </div>
                )}
                {project.startDate && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <span className="text-muted block">Start Date</span>
                      {formatDate(project.startDate)}
                    </div>
                  </div>
                )}
                {project.expectedCompletion && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <span className="text-muted block">Expected Completion</span>
                      {formatDate(project.expectedCompletion)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {project.documents.length > 0 && (
              <div className="border border-border bg-surface-elevated p-6">
                <h3 className="public-panel-heading">Documents</h3>
                <ul className="space-y-2">
                  {project.documents.map((doc) => (
                    <li key={doc.id}>
                      <a href={doc.media.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        {doc.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link href="/projects" className="text-sm text-primary hover:underline">
              ← Back to all projects
            </Link>
          </aside>
        </div>
      </section>

      {project.newsPosts.length > 0 && (
        <section className="section-padding-tight bg-surface">
          <div className="container-wide">
            <h2 className="public-content-heading mb-5">Related News</h2>
            <div className="public-content-grid">
              {project.newsPosts.map((n) => (
                <div key={n.id} className="h-full">
                  <NewsCard
                    slug={n.slug}
                    title={n.title}
                    category={n.category}
                    summary={n.summary}
                    publishedAt={n.publishedAt}
                    imageUrl={n.featuredImage?.url}
                    imageFocusX={n.imageFocusX}
                    imageFocusY={n.imageFocusY}
                    imageZoom={n.imageZoom}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
