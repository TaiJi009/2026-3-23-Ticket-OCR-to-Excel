import { Download, LoaderCircle, Play, RefreshCw, Trash2, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ApiKeyInput from "../components/ApiKeyInput";
import ImageUploader from "../components/ImageUploader";
import ReceiptTable from "../components/ReceiptTable";
import { resolveZhipuApiKey } from "../config/builtinApi";
import { exportReceiptsToExcel, type ExportMode } from "../lib/exportExcel";
import {
  readApiKey,
  readApiKeySourceMode,
  type ApiKeySourceMode,
  writeApiKey,
  writeApiKeySourceMode
} from "../lib/storage";
import { recognizeReceipt, testApiKey } from "../lib/zhipu";
import type { QueueFile, Receipt } from "../types/receipt";

export type ReceiptOcrNavApiStatus = "idle" | "testing" | "success" | "error";

export interface ReceiptOcrPageProps {
  onApiStatusChange?: (status: ReceiptOcrNavApiStatus) => void;
}

function newQueueFile(file: File): QueueFile {
  return {
    id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: URL.createObjectURL(file),
    status: "pending"
  };
}

export default function ReceiptOcrPage({ onApiStatusChange }: ReceiptOcrPageProps) {
  const [apiKey, setApiKey] = useState<string>(() => readApiKey());
  const [apiKeySourceMode, setApiKeySourceMode] = useState<ApiKeySourceMode>(() => readApiKeySourceMode());
  const [apiStatus, setApiStatus] = useState<ReceiptOcrNavApiStatus>("idle");
  const [queue, setQueue] = useState<QueueFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [lightboxDragging, setLightboxDragging] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lightboxDragOriginRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });
  const lightboxWasDraggingRef = useRef(false);
  const [exportMode, setExportMode] = useState<ExportMode>("separate");
  const queueRef = useRef(queue);

  const effectiveApiKey = useMemo(
    () => resolveZhipuApiKey(apiKeySourceMode, apiKey),
    [apiKeySourceMode, apiKey]
  );

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    onApiStatusChange?.(apiStatus);
  }, [apiStatus, onApiStatusChange]);

  const closeLightbox = useCallback(() => {
    setLightboxUrl(null);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setLightboxDragging(false);
  }, []);

  useLayoutEffect(() => {
    if (!lightboxDragging) return;
    const onMove = (e: PointerEvent) => {
      const o = lightboxDragOriginRef.current;
      setLightboxPan({
        x: o.panX + (e.clientX - o.startX),
        y: o.panY + (e.clientY - o.startY)
      });
    };
    const onUp = () => {
      setLightboxDragging(false);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
  }, [lightboxDragging]);

  useEffect(() => {
    if (!lightboxUrl) {
      lightboxWasDraggingRef.current = false;
      return;
    }
    if (lightboxWasDraggingRef.current && !lightboxDragging) {
      setLightboxPan({ x: 0, y: 0 });
    }
    lightboxWasDraggingRef.current = lightboxDragging;
  }, [lightboxUrl, lightboxDragging]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const el = lightboxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setLightboxZoom((prev) => {
        const delta = e.deltaY > 0 ? -0.12 : 0.12;
        return Math.min(5, Math.max(0.2, prev + delta));
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [lightboxUrl]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightboxUrl, closeLightbox]);

  useEffect(() => {
    if (!effectiveApiKey.trim()) {
      setApiStatus("error");
      return;
    }
    setApiStatus("testing");
    testApiKey(effectiveApiKey).then((isValid) => {
      setApiStatus(isValid ? "success" : "error");
    });
  }, [effectiveApiKey]);

  useEffect(() => {
    return () => {
      queueRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const selected = useMemo(
    () => queue.find((item) => item.id === selectedId) ?? queue[0] ?? null,
    [queue, selectedId]
  );

  const completedCount = queue.filter((item) => item.status === "success").length;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const addFiles = (files: File[]) => {
    setQueue((prev) => {
      const next = [...prev, ...files.map(newQueueFile)];
      if (!selectedId && next[0]) setSelectedId(next[0].id);
      return next;
    });
  };

  const removeFile = (id: string) => {
    setQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((item) => item.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const updateReceipt = (id: string, receipt: Receipt) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, result: receipt } : item)));
  };

  const saveApiKey = (value: string) => {
    writeApiKey(value);
    setApiKey(value.trim());
    if (value.trim()) {
      showToast("自定义 API Key 已保存到本机。");
    } else {
      showToast("已清空。在「使用我自己的 Key」模式下需填写并保存后才能识别。");
    }
  };

  const setApiKeySource = (mode: ApiKeySourceMode) => {
    writeApiKeySourceMode(mode);
    setApiKeySourceMode(mode);
    showToast(mode === "builtin" ? "已切换为站点默认 API。" : "已切换为自定义 API，请填写并保存你的 Key。");
  };

  const runRecognition = async () => {
    if (!effectiveApiKey.trim()) {
      showToast(
        apiKeySourceMode === "custom"
          ? "当前为自定义 API：请先填写并保存你的智谱 API Key。"
          : "站点默认 API 不可用，请联系管理员。"
      );
      return;
    }
    if (queue.length === 0) {
      showToast("请先上传小票图片。");
      return;
    }

    setIsRecognizing(true);
    for (const entry of queue) {
      setQueue((prev) => prev.map((item) => (item.id === entry.id ? { ...item, status: "processing", errorMessage: undefined } : item)));
      try {
        const result = await recognizeReceipt(entry.file, effectiveApiKey);
        setQueue((prev) =>
          prev.map((item) =>
            item.id === entry.id ? { ...item, status: "success", result, errorMessage: undefined } : item
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "识别失败";
        setQueue((prev) =>
          prev.map((item) => (item.id === entry.id ? { ...item, status: "error", errorMessage: message } : item))
        );
      }
    }
    setIsRecognizing(false);
    showToast("批量识别已结束。");
  };

  const reRecognizeOne = async (id: string) => {
    if (!effectiveApiKey.trim()) {
      showToast(
        apiKeySourceMode === "custom"
          ? "当前为自定义 API：请先填写并保存你的智谱 API Key。"
          : "站点默认 API 不可用，请联系管理员。"
      );
      return;
    }
    const entry = queueRef.current.find((item) => item.id === id);
    if (!entry || entry.status === "processing") return;

    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "processing", errorMessage: undefined } : item))
    );
    try {
      const result = await recognizeReceipt(entry.file, effectiveApiKey);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "success", result, errorMessage: undefined } : item
        )
      );
      showToast("已重新识别该图片。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "识别失败";
      setQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "error", errorMessage: message } : item))
      );
    }
  };

  const exportExcel = () => {
    try {
      exportReceiptsToExcel(queue, exportMode);
      showToast(`Excel 导出成功（${exportMode === "merged" ? "合并汇总" : "分 Sheet"}模式）。`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "导出失败。");
    }
  };

  return (
    <>
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-3 py-4 sm:gap-5 sm:px-4 sm:py-5 md:grid-cols-2 md:gap-5 lg:grid-cols-[1.1fr_1.3fr] lg:gap-6">
        <section className="space-y-4">
          <ApiKeyInput
            mode={apiKeySourceMode}
            onModeChange={setApiKeySource}
            customKeyValue={apiKey}
            onSaveCustomKey={saveApiKey}
          />
          <ImageUploader onAddFiles={addFiles} />

          <section className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">待识别队列</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                已完成 {completedCount}/{queue.length}
              </span>
            </div>
            <div className="grid max-h-[min(50vh,18rem)] gap-2 overflow-auto pr-1 sm:max-h-80">
              {queue.length === 0 && (
                <p className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-gray-700/40 dark:text-gray-300">
                  还没有上传图片
                </p>
              )}
              {queue.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`group flex items-center gap-3 rounded-xl border p-2 text-left transition-colors ${
                    selected?.id === item.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40"
                  }`}
                >
                  <div
                    className="group/thumb relative h-14 w-14 shrink-0 cursor-zoom-in touch-manipulation"
                    onClick={(event) => {
                      event.stopPropagation();
                      setLightboxZoom(1);
                      setLightboxPan({ x: 0, y: 0 });
                      setLightboxDragging(false);
                      setLightboxUrl(item.previewUrl);
                    }}
                  >
                    <img src={item.previewUrl} alt={item.file.name} className="h-14 w-14 rounded-lg object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/15 transition-colors group-hover/thumb:bg-black/30 md:bg-black/0 md:group-hover/thumb:bg-black/30">
                      <ZoomIn className="h-5 w-5 text-white opacity-80 drop-shadow transition-opacity md:opacity-0 md:group-hover/thumb:opacity-100" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.status === "pending" && "等待中"}
                      {item.status === "processing" && "识别中..."}
                      {item.status === "success" && "已完成"}
                      {item.status === "error" && "失败"}
                    </p>
                    {item.errorMessage && <p className="truncate text-xs text-red-500">{item.errorMessage}</p>}
                  </div>
                  <span className="flex shrink-0 items-center gap-0.5">
                    {item.status === "processing" ? (
                      <span className="rounded-full p-1.5">
                        <LoaderCircle className="h-4 w-4 animate-spin text-blue-500" />
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="touch-manipulation rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700/80 dark:hover:text-blue-400"
                          title="重新识别此图"
                          aria-label="重新识别此图"
                          onClick={(event) => {
                            event.stopPropagation();
                            void reRecognizeOne(item.id);
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="touch-manipulation rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700/80"
                          title="移除"
                          aria-label="移除"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeFile(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </span>
                </button>
              ))}
            </div>
            {queue.some((item) => item.status === "success") && (
              <div className="mt-3 flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700/50">
                <button
                  type="button"
                  onClick={() => setExportMode("separate")}
                  className={`min-h-10 flex-1 touch-manipulation rounded-md px-2 py-2 text-xs font-medium transition-colors sm:min-h-0 sm:py-1 ${
                    exportMode === "separate"
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  分 Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode("merged")}
                  className={`min-h-10 flex-1 touch-manipulation rounded-md px-2 py-2 text-xs font-medium transition-colors sm:min-h-0 sm:py-1 ${
                    exportMode === "merged"
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  合并汇总
                </button>
              </div>
            )}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-primary w-full flex-1 justify-center sm:w-auto"
                onClick={runRecognition}
                disabled={isRecognizing || queue.length === 0}
              >
                {isRecognizing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                开始识别
              </button>
              <button
                type="button"
                className="btn-secondary w-full flex-1 justify-center sm:w-auto"
                onClick={exportExcel}
                disabled={queue.every((item) => item.status !== "success")}
              >
                <Download className="h-4 w-4" />
                导出 Excel
              </button>
            </div>
          </section>
        </section>

        <section>
          {!selected?.result ? (
            <div className="card flex min-h-[min(42vh,16rem)] items-center justify-center px-3 text-center text-xs text-gray-500 sm:min-h-[420px] sm:text-sm dark:text-gray-400">
              上传并识别后，这里会显示可编辑的结构化结果。
            </div>
          ) : (
            <div className="space-y-4">
              <section className="card">
                <h2 className="mb-2 text-sm font-semibold">原图预览</h2>
                <div
                  className="group/preview relative cursor-zoom-in touch-manipulation"
                  onClick={() => {
                    setLightboxZoom(1);
                    setLightboxPan({ x: 0, y: 0 });
                    setLightboxDragging(false);
                    setLightboxUrl(selected.previewUrl);
                  }}
                >
                  <img
                    src={selected.previewUrl}
                    alt={selected.file.name}
                    className="max-h-[min(45vh,20rem)] w-full rounded-xl object-contain sm:max-h-[320px]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/10 transition-colors group-hover/preview:bg-black/25 md:bg-black/0 md:group-hover/preview:bg-black/25">
                    <ZoomIn className="h-7 w-7 text-white opacity-70 drop-shadow transition-opacity sm:h-8 sm:w-8 md:opacity-0 md:group-hover/preview:opacity-100" />
                  </div>
                </div>
              </section>
              <ReceiptTable receipt={selected.result} onChange={(next) => updateReceipt(selected.id, next)} />
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 rounded-xl bg-gray-900 px-4 py-3 text-center text-sm text-white shadow-lg sm:left-1/2 sm:right-auto sm:w-auto sm:max-w-lg sm:-translate-x-1/2 sm:px-5 sm:py-2.5 dark:bg-gray-100 dark:text-gray-900">
          {toast}
        </div>
      )}

      {lightboxUrl && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] min-h-11 min-w-11 touch-manipulation rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={closeLightbox}
          >
            <X className="h-5 w-5" />
          </button>

          {lightboxZoom !== 1 && (
            <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-sm">
              {Math.round(lightboxZoom * 100)}%
            </div>
          )}

          <div
            className={`flex max-h-[90vh] max-w-[90vw] select-none items-center justify-center ${lightboxDragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{ touchAction: "none" }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.stopPropagation();
              event.preventDefault();
              lightboxDragOriginRef.current = {
                startX: event.clientX,
                startY: event.clientY,
                panX: lightboxPan.x,
                panY: lightboxPan.y
              };
              setLightboxDragging(true);
            }}
          >
            <div
              style={{
                transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom})`,
                transformOrigin: "center center",
                transition: lightboxDragging ? "none" : "transform 0.2s ease"
              }}
            >
              <img
                src={lightboxUrl}
                alt="图片预览"
                draggable={false}
                className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  setLightboxZoom(1);
                  setLightboxPan({ x: 0, y: 0 });
                }}
              />
            </div>
          </div>

          <p className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 max-w-[90vw] -translate-x-1/2 px-2 text-center text-[10px] text-white/50 sm:text-xs">
            <span className="hidden sm:inline">滚轮缩放 · </span>
            拖动平移 · 松手归中 · 双击重置 · Esc 关闭
          </p>
        </div>
      )}
    </>
  );
}
