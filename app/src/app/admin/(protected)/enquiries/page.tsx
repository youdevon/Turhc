import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EnquiryList } from "@/components/admin/EnquiryList";
import { EnquiryPageError } from "@/components/admin/EnquiryPageError";
import {
  ENQUIRIES_PAGE_SIZE,
  loadEnquiriesList,
  type EnquiryListFilter,
} from "@/lib/enquiry-service";

type Props = {
  searchParams: Promise<{ filter?: string; q?: string; page?: string }>;
};

export default async function EnquiriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const filter = (params.filter ?? "all") as EnquiryListFilter;
  const search = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  try {
    const { enquiries, total, unreadCount } = await loadEnquiriesList({
      filter,
      search,
      page,
    });

    return (
      <>
        <AdminHeader
          title="Enquiries"
          description={
            unreadCount > 0
              ? `${unreadCount} unread ${unreadCount === 1 ? "enquiry" : "enquiries"}`
              : "Manage contact form submissions"
          }
          breadcrumbs={[{ label: "Enquiries" }]}
        />
        <Suspense fallback={<p className="text-muted text-sm">Loading…</p>}>
          <EnquiryList
            enquiries={enquiries}
            total={total}
            page={page}
            pageSize={ENQUIRIES_PAGE_SIZE}
            filter={filter}
            search={search}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    console.error("Failed to load enquiries:", error);
    return (
      <>
        <AdminHeader
          title="Enquiries"
          description="Manage contact form submissions"
          breadcrumbs={[{ label: "Enquiries" }]}
        />
        <EnquiryPageError />
      </>
    );
  }
}
