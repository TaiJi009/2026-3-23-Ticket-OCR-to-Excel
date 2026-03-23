import type { Receipt } from "../types/receipt";

const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

function extractJson(text: string): string {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("模型返回内容不是有效 JSON。");
  }
  return cleaned.slice(start, end + 1);
}

function normalizeReceipt(raw: unknown): Receipt {
  const parsed = (raw ?? {}) as {
    storeName?: string | null;
    date?: string | null;
    items?: Array<{
      name?: string;
      price?: number | string | null;
      quantity?: number | string | null;
      subtotal?: number | string | null;
    }>;
    total?: number | string | null;
  };

  const toNumber = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  return {
    storeName: parsed.storeName ?? null,
    date: parsed.date ?? null,
    items: (parsed.items ?? []).map((item) => ({
      name: item.name?.trim() || "",
      price: toNumber(item.price),
      quantity: toNumber(item.quantity),
      subtotal: toNumber(item.subtotal)
    })),
    total: toNumber(parsed.total)
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("读取图片失败。"));
    reader.readAsDataURL(file);
  });
}

export async function recognizeReceipt(file: File, apiKey: string): Promise<Receipt> {
  if (!apiKey.trim()) {
    throw new Error("请先设置智谱 API Key。");
  }

  const imageDataUrl = await fileToDataUrl(file);
  const prompt =
    "请识别这张超市购物小票，提取以下信息并只返回 JSON，不要任何解释文字或代码块：" +
    '{ "date":"YYYY-MM-DD HH:mm", "storeName":"超市名称", "items":[{"name":"商品名称","price":数字,"quantity":数字,"subtotal":数字}], "total":数字 }' +
    "。如字段缺失请返回 null；数字字段必须是数字而不是字符串。";

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: "glm-4v-flash",
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageDataUrl } },
            { type: "text", text: prompt }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`识别失败: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("模型没有返回识别内容。");
  }

  const jsonText = extractJson(content);
  const parsed = JSON.parse(jsonText) as unknown;
  return normalizeReceipt(parsed);
}
