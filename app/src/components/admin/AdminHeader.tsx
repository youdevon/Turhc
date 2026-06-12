import { Breadcrumbs } from "./Breadcrumbs";

type Props = {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
};

export function AdminHeader({ title, description, breadcrumbs, actions }: Props) {
  return (
    <header className="admin-page-header">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mt-3">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="admin-page-title">{title}</h1>
          {description && <p className="admin-page-description">{description}</p>}
        </div>
        {actions && <div className="admin-actions shrink-0 sm:items-center">{actions}</div>}
      </div>
    </header>
  );
}
