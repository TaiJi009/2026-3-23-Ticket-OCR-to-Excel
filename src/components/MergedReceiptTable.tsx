import { useMemo, useState } from "react";
import SortableTh from "./SortableTh";
import type { QueueFile, Receipt, ReceiptItem } from "../types/receipt";
import {
  buildMergedFlatRows,
  sortMergedRows,
  type ReceiptColumnKey,
  type SortDir
} from "../lib/receiptTableSort";

interface MergedReceiptTableProps {
  queue: QueueFile[];
  onUpdateReceipt: (queueId: string, next: Receipt) => void;
}

function toNumber(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function MergedReceiptTable({ queue, onUpdateReceipt }: MergedReceiptTableProps) {
  const [sortKey, setSortKey] = useState<ReceiptColumnKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: ReceiptColumnKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const flatRows = useMemo(() => buildMergedFlatRows(queue), [queue]);
  const displayRows = useMemo(() => sortMergedRows(flatRows, sortKey, sortDir), [flatRows, sortKey, sortDir]);

  const updateItemField = (queueId: string, itemIndex: number, key: keyof ReceiptItem, value: string) => {
    const q = queue.find((x) => x.id === queueId);
    if (!q?.result) return;
    const receipt = q.result;
    const items = receipt.items.map((item, i) => {
      if (i !== itemIndex) return item;
      if (key === "name") return { ...item, name: value };
      return { ...item, [key]: toNumber(value) };
    });
    onUpdateReceipt(queueId, { ...receipt, items });
  };

  const updateReceiptMeta = (queueId: string, field: "date" | "storeName", value: string) => {
    const q = queue.find((x) => x.id === queueId);
    if (!q?.result) return;
    const receipt = q.result;
    onUpdateReceipt(queueId, { ...receipt, [field]: value || null });
  };

  const inputCls =
    "min-h-10 min-w-[5rem] w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm md:min-h-0 md:py-1 dark:border-gray-600 dark:bg-gray-900";
  const metaInputCls =
    "min-h-10 min-w-0 w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm md:min-w-[10rem] md:py-1 dark:border-gray-600 dark:bg-gray-900";
  const thHiddenMd = "hidden whitespace-nowrap px-2 py-2 md:table-cell md:px-3";
  const thVisible = "whitespace-nowrap px-2 py-2 md:px-3";
  const tdHiddenMd = "hidden align-top px-2 py-2 md:table-cell md:px-3";
  const tdCell = "px-2 py-2 md:px-3";

  if (flatRows.length === 0) {
    return (
      <section className="card overflow-hidden p-3 sm:p-4 md:p-5">
        <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">校对与编辑（合并汇总）</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">暂无已识别完成的小票，请先完成识别。</p>
      </section>
    );
  }

  return (
    <section className="card overflow-hidden p-3 sm:p-4 md:p-5">
      <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">校对与编辑（合并汇总）</h2>
      <p className="mb-3 text-[11px] text-gray-500 md:hidden dark:text-gray-400">
        全部已识别小票的商品行合并为一张表，与「合并汇总」导出列一致；点击表头可排序。
      </p>

      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1 sm:mx-0 sm:px-0">
        <table className="min-w-[min(100%,36rem)] w-full text-xs sm:min-w-0 sm:text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-700 dark:bg-gray-700/50 dark:text-gray-200">
              <SortableTh
                label="购物时间"
                columnKey="date"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                className={thHiddenMd}
              />
              <SortableTh
                label="超市名称"
                columnKey="store"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                className={thHiddenMd}
              />
              <SortableTh
                label="商品名称"
                columnKey="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                className={thVisible}
              />
              <SortableTh
                label="数量"
                columnKey="qty"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                className={thVisible}
              />
              <SortableTh
                label="单价"
                columnKey="price"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                className={thVisible}
              />
              <SortableTh
                label="小计"
                columnKey="subtotal"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                className={thVisible}
              />
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIdx) => (
              <tr key={`${row.queueId}-${row.itemIndex}-${rowIdx}`} className="border-b border-gray-100 dark:border-gray-700">
                <td className={`${tdHiddenMd} align-top`}>
                  <input
                    value={row.receipt.date ?? ""}
                    onChange={(e) => updateReceiptMeta(row.queueId, "date", e.target.value)}
                    className={metaInputCls}
                    placeholder="时间"
                    autoComplete="off"
                  />
                </td>
                <td className={`${tdHiddenMd} align-top`}>
                  <input
                    value={row.receipt.storeName ?? ""}
                    onChange={(e) => updateReceiptMeta(row.queueId, "storeName", e.target.value)}
                    className={metaInputCls}
                    placeholder="超市名称"
                    autoComplete="off"
                  />
                </td>
                <td className={tdCell}>
                  <input
                    value={row.item.name}
                    onChange={(e) => updateItemField(row.queueId, row.itemIndex, "name", e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className={tdCell}>
                  <input
                    inputMode="decimal"
                    value={row.item.quantity ?? ""}
                    onChange={(e) => updateItemField(row.queueId, row.itemIndex, "quantity", e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className={tdCell}>
                  <input
                    inputMode="decimal"
                    value={row.item.price ?? ""}
                    onChange={(e) => updateItemField(row.queueId, row.itemIndex, "price", e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className={tdCell}>
                  <input
                    inputMode="decimal"
                    value={row.item.subtotal ?? ""}
                    onChange={(e) => updateItemField(row.queueId, row.itemIndex, "subtotal", e.target.value)}
                    className={inputCls}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
