import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";

interface ImageUploaderProps {
  onAddFiles: (files: File[]) => void;
}

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUploader({ onAddFiles }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const pickFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const filtered = Array.from(files).filter((file) => SUPPORTED_TYPES.includes(file.type));
    if (filtered.length) onAddFiles(filtered);
  };

  return (
    <section className="card">
      <div
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-300 hover:border-blue-400 dark:border-gray-600"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          pickFiles(event.dataTransfer.files);
        }}
      >
        <ImagePlus className="mx-auto mb-3 h-10 w-10 text-blue-600 dark:text-blue-400" />
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100">上传小票图片</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          点击选择或拖拽多张图片（JPG / PNG / WEBP）
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => pickFiles(event.target.files)}
      />
    </section>
  );
}
