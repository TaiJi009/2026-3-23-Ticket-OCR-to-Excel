import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReceiptColumnKey, SortDir } from "../lib/receiptTableSort";

interface SortableThProps {
  label: string;
  columnKey: ReceiptColumnKey;
  sortKey: ReceiptColumnKey | null;
  sortDir: SortDir;
  onSort: (key: ReceiptColumnKey) => void;
  className?: string;
}

export default function SortableTh({ label, columnKey, sortKey, sortDir, onSort, className = "" }: SortableThProps) {
  const active = sortKey === columnKey;
  return (
    <th scope="col" className={className}>
      <button
        type="button"
        className="inline-flex w-full min-w-0 items-center justify-start gap-0.5 rounded-md px-0 py-0.5 text-left font-medium text-gray-700 hover:bg-gray-200/80 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-600/50 dark:hover:text-white"
        onClick={() => onSort(columnKey)}
      >
        <span className="truncate">{label}</span>
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
        )}
      </button>
    </th>
  );
}
