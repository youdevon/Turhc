export default function PublicLoading() {
  return (
    <div className="section-padding animate-pulse" aria-hidden>
      <div className="container-wide space-y-4">
        <div className="h-8 w-48 rounded bg-surface-elevated" />
        <div className="h-4 w-full max-w-2xl rounded bg-surface-elevated" />
        <div className="h-4 w-5/6 max-w-xl rounded bg-surface-elevated" />
      </div>
    </div>
  );
}
