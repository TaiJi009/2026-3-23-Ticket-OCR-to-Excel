import type { Receipt, ReceiptItem } from "../types/receipt";

interface ReceiptTableProps {
  receipt: Receipt;
  onChange: (next: Receipt) => void;
}

function toNumber(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function ReceiptTable({ receipt, onChange }: ReceiptTableProps) {
  const updateItem = (index: number, key: keyof ReceiptItem, value: string) => {
    const items = receipt.items.map((item, currentIndex) => {
      if (currentIndex !== index) return item;
      if (key === "name") {
        return { ...item, name: value };
      }
      return { ...item, [key]: toNumber(value) };
    });
    onChange({ ...receipt, items });
  };

  const inputCls = "min-w-[7rem] w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900";
  const metaInputCls = "min-w-[10rem] w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900";

  return (
    <section className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-700 dark:bg-gray-700/50 dark:text-gray-200">
              <th className="whitespace-nowrap px-3 py-2">购物时间</th>
              <th className="whitespace-nowrap px-3 py-2">超市名称</th>
              <th className="whitespace-nowrap px-3 py-2">商品名称</th>
              <th className="whitespace-nowrap px-3 py-2">数量</th>
              <th className="whitespace-nowrap px-3 py-2">单价</th>
              <th className="whitespace-nowrap px-3 py-2">小计</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.length === 0 ? (
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="px-3 py-2 align-top">
                  <input
                    value={receipt.date ?? ""}
                    onChange={(event) => onChange({ ...receipt, date: event.target.value })}
                    className={metaInputCls}
                    placeholder="YYYY-MM-DD HH:mm"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    value={receipt.storeName ?? ""}
                    onChange={(event) => onChange({ ...receipt, storeName: event.target.value })}
                    className={metaInputCls}
                    placeholder="超市名称"
                  />
                </td>
                <td colSpan={4} className="px-3 py-4 text-center text-gray-400 dark:text-gray-500">
                  暂无商品
                </td>
              </tr>
            ) : (
              receipt.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="px-3 py-2 align-top">
                    <input
                      value={receipt.date ?? ""}
                      onChange={(event) => onChange({ ...receipt, date: event.target.value })}
                      className={metaInputCls}
                      placeholder="YYYY-MM-DD HH:mm"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      value={receipt.storeName ?? ""}
                      onChange={(event) => onChange({ ...receipt, storeName: event.target.value })}
                      className={metaInputCls}
                      placeholder="超市名称"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.name}
                      onChange={(event) => updateItem(index, "name", event.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.quantity ?? ""}
                      onChange={(event) => updateItem(index, "quantity", event.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.price ?? ""}
                      onChange={(event) => updateItem(index, "price", event.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.subtotal ?? ""}
                      onChange={(event) => updateItem(index, "subtotal", event.target.value)}
                      className={inputCls}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:text-gray-200">
        <span>合计</span>
        <input
          value={receipt.total ?? ""}
          onChange={(event) => onChange({ ...receipt, total: toNumber(event.target.value) })}
          className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-right dark:border-gray-600 dark:bg-gray-900"
        />
      </div>
    </section>
  );
}
