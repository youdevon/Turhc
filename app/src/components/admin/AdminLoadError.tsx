import { AlertBanner } from "@/components/ui/AlertBanner";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function AdminLoadError({
  title = "This section could not be loaded",
  message = "Please try again or contact the administrator.",
  onRetry,
}: Props) {
  return (
    <AlertBanner variant="error" title={title} centered className="p-10">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="admin-btn admin-btn-secondary mt-4" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </AlertBanner>
  );
}

export { friendlySaveError } from "@/lib/notify";
