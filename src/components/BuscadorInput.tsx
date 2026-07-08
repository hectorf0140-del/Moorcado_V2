"use client";

import { Search } from "lucide-react";

export default function BuscadorInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/10">
      <Search className="h-4 w-4 text-moorcado-gray-dark/50" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-moorcado-gray-dark/40"
      />
    </label>
  );
}
