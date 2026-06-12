import type { ReactNode } from "react";

/**
 * Minimal inline markdown: **bold**, line breaks, bullet lines.
 */
export function renderSimpleMarkdown(text: string): ReactNode[] {
  return text.split("\n").map((line, lineIndex) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const children = parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      <span key={lineIndex}>
        {children}
        {lineIndex < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}
