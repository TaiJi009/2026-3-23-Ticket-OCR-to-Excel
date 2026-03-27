import type { Receipt, ReceiptItem } from "../types/receipt";

export type ReceiptColumnKey = "date" | "store" | "name" | "qty" | "price" | "subtotal";

export type SortDir = "asc" | "desc";

/** 比较两行（用于单张小票多行，或合并表扁平行） */
export function compareByColumn(
  getA: () => string | number | null | undefined,
  getB: () => string | number | null | undefined,
  key: ReceiptColumnKey,
  dir: SortDir
): number {
  const mul = dir === "asc" ? 1 : -1;
  const va = getA();
  const vb = getB();

  const numKeys: ReceiptColumnKey[] = ["qty", "price", "subtotal"];
  if (numKeys.includes(key)) {
    const na = va === null || va === undefined || va === "" ? NaN : Number(va);
    const nb = vb === null || vb === undefined || vb === "" ? NaN : Number(vb);
    if (Number.isNaN(na) && Number.isNaN(nb)) return 0;
    if (Number.isNaN(na)) return 1;
    if (Number.isNaN(nb)) return -1;
    return (na - nb) * mul;
  }

  const sa = String(va ?? "").trim();
  const sb = String(vb ?? "").trim();
  return sa.localeCompare(sb, "zh-CN", { numeric: true }) * mul;
}

export function sortIndicesForReceipt(
  receipt: Receipt,
  sortKey: ReceiptColumnKey | null,
  sortDir: SortDir
): number[] {
  const n = receipt.items.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  if (!sortKey || n <= 1) return indices;

  indices.sort((ia, ib) => {
    const itemA = receipt.items[ia];
    const itemB = receipt.items[ib];
    return compareByColumn(
      () => {
        switch (sortKey) {
          case "date":
            return receipt.date ?? "";
          case "store":
            return receipt.storeName ?? "";
          case "name":
            return itemA.name;
          case "qty":
            return itemA.quantity;
          case "price":
            return itemA.price;
          case "subtotal":
            return itemA.subtotal;
        }
      },
      () => {
        switch (sortKey) {
          case "date":
            return receipt.date ?? "";
          case "store":
            return receipt.storeName ?? "";
          case "name":
            return itemB.name;
          case "qty":
            return itemB.quantity;
          case "price":
            return itemB.price;
          case "subtotal":
            return itemB.subtotal;
        }
      },
      sortKey,
      sortDir
    );
  });
  return indices;
}

export type MergedFlatRow = {
  queueId: string;
  itemIndex: number;
  receipt: Receipt;
  item: ReceiptItem;
};

export function buildMergedFlatRows(queue: { id: string; status: string; result?: Receipt }[]): MergedFlatRow[] {
  const out: MergedFlatRow[] = [];
  for (const q of queue) {
    if (q.status !== "success" || !q.result) continue;
    const receipt = q.result;
    receipt.items.forEach((item, itemIndex) => {
      out.push({ queueId: q.id, itemIndex, receipt, item });
    });
  }
  return out;
}

export function sortMergedRows(rows: MergedFlatRow[], sortKey: ReceiptColumnKey | null, sortDir: SortDir): MergedFlatRow[] {
  if (!sortKey || rows.length <= 1) return rows.slice();
  const copy = rows.slice();
  copy.sort((ra, rb) =>
    compareByColumn(
      () => {
        switch (sortKey) {
          case "date":
            return ra.receipt.date ?? "";
          case "store":
            return ra.receipt.storeName ?? "";
          case "name":
            return ra.item.name;
          case "qty":
            return ra.item.quantity;
          case "price":
            return ra.item.price;
          case "subtotal":
            return ra.item.subtotal;
        }
      },
      () => {
        switch (sortKey) {
          case "date":
            return rb.receipt.date ?? "";
          case "store":
            return rb.receipt.storeName ?? "";
          case "name":
            return rb.item.name;
          case "qty":
            return rb.item.quantity;
          case "price":
            return rb.item.price;
          case "subtotal":
            return rb.item.subtotal;
        }
      },
      sortKey,
      sortDir
    )
  );
  return copy;
}
