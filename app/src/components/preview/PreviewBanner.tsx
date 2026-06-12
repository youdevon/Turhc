import Link from "next/link";

type Props = {
  backUrl?: string;
  liveUrl?: string;
};

export function PreviewBanner({ backUrl, liveUrl }: Props) {
  return (
    <div className="preview-banner bg-amber-500 text-amber-950 px-4 py-2.5 text-sm flex flex-wrap items-center justify-between gap-2 shadow-md">
      <span className="font-semibold">Preview Mode — Draft content is not live</span>
      <div className="flex items-center gap-4">
        {liveUrl && (
          <Link href={liveUrl} target="_blank" className="underline font-medium hover:opacity-80">
            View Live Page
          </Link>
        )}
        {backUrl && (
          <Link href={backUrl} className="underline font-medium hover:opacity-80">
            Back to CMS
          </Link>
        )}
      </div>
    </div>
  );
}
