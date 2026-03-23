import { KeyRound, Save } from "lucide-react";
import { useState } from "react";

interface ApiKeyInputProps {
  initialValue: string;
  onSave: (value: string) => void;
}

export default function ApiKeyInput({ initialValue, onSave }: ApiKeyInputProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <section className="card">
      <div className="mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-200">
        <KeyRound className="h-4 w-4" />
        <h2 className="text-sm font-semibold">智谱 API Key</h2>
      </div>
      <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
        Key 仅保存在当前浏览器 localStorage，不会发送到你的服务器。
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="输入你的 API Key"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-blue-300 transition focus:ring-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        <button
          type="button"
          onClick={() => onSave(value)}
          className="btn-primary justify-center whitespace-nowrap"
        >
          <Save className="h-4 w-4" />
          保存 Key
        </button>
      </div>
    </section>
  );
}
