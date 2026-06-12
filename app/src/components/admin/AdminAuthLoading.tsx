export function AdminAuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center site-texture"
      role="status"
      aria-live="polite"
      aria-label="Loading admin console"
    >
      <p className="text-sm text-muted">Loading…</p>
    </div>
  );
}
