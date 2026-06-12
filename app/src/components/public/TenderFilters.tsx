"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

type Props = {
  categories: string[];
  years: number[];
};

export function TenderFilters({ categories, years }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");

  function update(param: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(param, value);
    else params.delete(param);
    router.push(`/tenders?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    update("q", keyword);
  }

  return (
    <div className="border border-border bg-surface-elevated p-4 mb-8 flex flex-col lg:flex-row flex-wrap gap-4 min-w-0">
      <form onSubmit={handleSearch} className="flex-1 min-w-0 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search tenders..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
        />
      </form>
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="w-full lg:w-auto min-w-0 flex-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
      >
        <option value="">All Statuses</option>
        <option value="OPEN">Open</option>
        <option value="CLOSED">Closed</option>
        <option value="AWARDED">Awarded</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <select
        value={searchParams.get("category") ?? ""}
        onChange={(e) => update("category", e.target.value)}
        className="w-full lg:w-auto min-w-0 flex-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        value={searchParams.get("year") ?? ""}
        onChange={(e) => update("year", e.target.value)}
        className="w-full lg:w-auto min-w-0 flex-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
      >
        <option value="">All Years</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
