"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { isPreviewPath, toPreviewHref } from "@/lib/preview-paths";

type Props = ComponentProps<typeof Link>;

export function PreviewAwareLink({ href, ...props }: Props) {
  const pathname = usePathname();
  const resolvedHref =
    typeof href === "string" && isPreviewPath(pathname) ? toPreviewHref(href) : href;

  return <Link href={resolvedHref} {...props} />;
}
