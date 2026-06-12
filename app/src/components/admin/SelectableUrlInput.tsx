"use client";

type Props = {
  value: string;
  className?: string;
};

export function SelectableUrlInput({ value, className }: Props) {
  return (
    <input
      readOnly
      value={value}
      className={className}
      onClick={(e) => (e.target as HTMLInputElement).select()}
      aria-label="Media URL — click to select"
    />
  );
}
