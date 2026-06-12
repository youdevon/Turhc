export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-10 w-64 rounded-lg bg-surface-elevated" />
      <div className="h-4 w-96 max-w-full rounded bg-surface-elevated" />
      <div className="border border-border bg-surface-elevated h-64" />
    </div>
  );
}
