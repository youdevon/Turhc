import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EnquiryDetailPanel } from "@/components/admin/EnquiryDetailPanel";
import { EnquiryPageError } from "@/components/admin/EnquiryPageError";
import { markEnquiryReadOnView } from "@/lib/enquiry-service";
import { getEnquiryDisplayName } from "@/lib/enquiry-types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EnquiryDetailPage({ params }: Props) {
  const { id } = await params;

  try {
    let enquiry = await prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) notFound();

    if (!enquiry.isDeleted && !enquiry.isRead) {
      const session = await getServerSession(authOptions);
      const reader = session?.user?.name ?? session?.user?.email ?? "Admin";
      const updated = await markEnquiryReadOnView(id, reader);
      if (updated) enquiry = updated;
    }

    const name = getEnquiryDisplayName(enquiry);

    return (
      <>
        <AdminHeader
          title={name}
          description={`Enquiry from ${enquiry.email || "unknown"}`}
          breadcrumbs={[
            { label: "Enquiries", href: "/admin/enquiries" },
            { label: name },
          ]}
        />
        <EnquiryDetailPanel enquiry={enquiry} />
      </>
    );
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error(`Failed to load enquiry ${id}:`, error);
    return (
      <>
        <AdminHeader
          title="Enquiry"
          breadcrumbs={[
            { label: "Enquiries", href: "/admin/enquiries" },
            { label: "Error" },
          ]}
        />
        <EnquiryPageError
          title="Could not load this enquiry"
          message="The enquiry may have been removed, or there was a temporary problem loading it."
        />
      </>
    );
  }
}
