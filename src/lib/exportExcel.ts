import * as XLSX from "xlsx";
import type { QueueFile } from "../types/receipt";

function safeSheetName(name: string): string {
  return name.replace(/[\\/*?:[\]]/g, "_").slice(0, 31) || "小票";
}

export function exportReceiptsToExcel(files: QueueFile[]): void {
  const successFiles = files.filter((item) => item.status === "success" && item.result);
  if (successFiles.length === 0) {
    throw new Error("暂无可导出的识别结果。");
  }

  const workbook = XLSX.utils.book_new();

  successFiles.forEach((entry, index) => {
    const result = entry.result!;
    const rows: Array<Record<string, string | number | null>> = [];

    rows.push({
      店铺: result.storeName ?? "未知超市",
      购物时间: result.date ?? "未知时间",
      商品名称: "",
      单价: "",
      数量: "",
      小计: "",
      合计: ""
    });

    rows.push({
      店铺: "",
      购物时间: "",
      商品名称: "商品名称",
      单价: "单价",
      数量: "数量",
      小计: "小计",
      合计: ""
    });

    result.items.forEach((item) => {
      rows.push({
        店铺: "",
        购物时间: "",
        商品名称: item.name,
        单价: item.price,
        数量: item.quantity,
        小计: item.subtotal,
        合计: ""
      });
    });

    rows.push({
      店铺: "",
      购物时间: "",
      商品名称: "",
      单价: "",
      数量: "",
      小计: "",
      合计: result.total
    });

    const worksheet = XLSX.utils.json_to_sheet(rows, { skipHeader: true });
    worksheet["!cols"] = [{ wch: 16 }, { wch: 18 }, { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];

    const nameSource = `${result.storeName ?? "小票"}-${result.date ?? index + 1}`;
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(nameSource));
  });

  XLSX.writeFile(workbook, `超市小票识别_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
