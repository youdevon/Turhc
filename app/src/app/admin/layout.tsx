import type { Metadata } from "next";
import { Providers } from "@/components/admin/Providers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin Console",
    template: "%s · Admin Console",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
