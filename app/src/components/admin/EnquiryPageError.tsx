import Link from "next/link";
import { AlertBanner } from "@/components/ui/AlertBanner";

type Props = {
  title?: string;
  message?: string;
};

export function EnquiryPageError({
  title = "Could not load enquiries",
  message = "Something went wrong while loading enquiries. Your data is still safe — try refreshing the page.",
}: Props) {
  return (
    <AlertBanner
      variant="warning"
      title={title}
      centered
      className="p-8"
      actions={
        <Link href="/admin/enquiries" className="admin-btn-primary">
          Try again
        </Link>
      }
    >
      <p>{message}</p>
    </AlertBanner>
  );
}
