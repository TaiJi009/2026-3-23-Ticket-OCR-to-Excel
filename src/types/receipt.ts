export interface ReceiptItem {
  name: string;
  price: number | null;
  quantity: number | null;
  subtotal: number | null;
}

export interface Receipt {
  storeName: string | null;
  date: string | null;
  items: ReceiptItem[];
  total: number | null;
}

export type QueueStatus = "pending" | "processing" | "success" | "error";

export interface QueueFile {
  id: string;
  file: File;
  previewUrl: string;
  status: QueueStatus;
  errorMessage?: string;
  result?: Receipt;
}
