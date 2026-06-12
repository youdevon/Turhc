import { AlertBanner } from "@/components/ui/AlertBanner";

type Props = {
  title?: string;
  message?: string;
};

export function AdminLoadError({
  title = "This section could not be loaded",
  message = "Please try again or contact the administrator.",
}: Props) {
  return (
    <AlertBanner variant="error" title={title} centered className="p-10">
      <p>{message}</p>
    </AlertBanner>
  );
}

export { friendlySaveError } from "@/lib/notify";
