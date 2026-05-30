import { useCallback, useEffect, useRef, useState } from "react";

type Quality = "high" | "medium" | "low";

type Status =
  | "idle"
  | "estimating"
  | "estimated"
  | "compressing"
  | "done"
  | "error";

interface FileItem {
  id: string;
  file: File;
  status: Status;
  numPages?: number;
  estimatedSize?: number;
  progress: number;
  resultUrl?: string;
  resultSize?: number;
  error?: string;
}

const QUALITY_SETTINGS: Record<
  Quality,
  { scale: number; jpeg: number; label: string; hint: string }
> = {
  high: {
    scale: 1.5,
    jpeg: 0.82,
    label: "کیفیت بالا",
    hint: "کمترین افت کیفیت",
  },
  medium: { scale: 1.0, jpeg: 0.6, label: "متعادل", hint: "تعادل حجم و کیفیت" },
  low: { scale: 0.7, jpeg: 0.4, label: "حجم کم", hint: "بیشترین فشرده‌سازی" },
};

const toFa = (s: string | number) =>
  String(s).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "۰ بایت";
  const units = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${toFa(value)} ${units[i]}`;
}

// ---------- کمکی‌های pdf.js ----------
async function getPdfjs() {
  const lib = await import("pdfjs-dist");
  if (!lib.GlobalWorkerOptions.workerPort) {
    lib.GlobalWorkerOptions.workerPort = new Worker(
      new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
      { type: "module" },
    );
  }
  return lib;
}

function base64Bytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const b64 = dataUrl.slice(comma + 1);
  return Math.round((b64.length * 3) / 4);
}

// تخمین حجم خروجی — هیچ‌وقت بزرگ‌تر از فایل اصلی گزارش نمی‌شود
async function estimateOutput(
  file: File,
  quality: Quality,
): Promise<{ numPages: number; estimatedSize: number }> {
  const pdfjsLib = await getPdfjs();
  const settings = QUALITY_SETTINGS[quality];
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const numPages = pdf.numPages;

  const sampleCount = Math.min(numPages, 2);
  let totalSampleBytes = 0;

  for (let p = 1; p <= sampleCount; p++) {
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: settings.scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(vp.width));
    canvas.height = Math.max(1, Math.floor(vp.height));
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
    totalSampleBytes += base64Bytes(
      canvas.toDataURL("image/jpeg", settings.jpeg),
    );
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }

  const avgPerPage = totalSampleBytes / sampleCount;
  const raw = Math.round(avgPerPage * numPages * 1.05);
  // اگر تخمین از فایل اصلی بزرگ‌تر شد، یعنی کاهشی در کار نیست → سقف = حجم اصلی
  const estimatedSize = Math.min(raw, file.size);
  return { numPages, estimatedSize };
}

// خروجی: اگر نسخهٔ فشرده از اصل بزرگ‌تر شد، خودِ فایل اصلی برگردانده می‌شود
async function compressPdf(
  file: File,
  quality: Quality,
  onProgress: (done: number, total: number) => void,
): Promise<Blob> {
  const pdfjsLib = await getPdfjs();
  const { jsPDF } = await import("jspdf");
  const settings = QUALITY_SETTINGS[quality];
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let doc: InstanceType<typeof jsPDF> | null = null;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale: settings.scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(renderViewport.width));
    canvas.height = Math.max(1, Math.floor(renderViewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("امکان ساخت canvas وجود ندارد");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: renderViewport, canvas })
      .promise;

    const imgData = canvas.toDataURL("image/jpeg", settings.jpeg);
    const wpt = baseViewport.width;
    const hpt = baseViewport.height;

    if (!doc) {
      doc = new jsPDF({ unit: "pt", format: [wpt, hpt] });
    } else {
      doc.addPage([wpt, hpt]);
    }
    doc.addImage(imgData, "JPEG", 0, 0, wpt, hpt, undefined, "FAST");

    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
    onProgress(pageNum, pdf.numPages);
  }

  if (!doc) throw new Error("این فایل صفحه‌ای ندارد");
  const out = doc.output("blob");
  // هرگز فایل را بزرگ‌تر نکن
  return out.size < file.size ? out : file;
}

// ---------- گراف دایره‌ای ----------
function Donut({ percent, size = 96 }: { percent: number; size?: number }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;
  const cx = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
    >
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="#e7e5e4"
        strokeWidth="8"
      />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="#c63d22"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{
          transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)",
        }}
      />
      <text
        x={cx}
        y={cx - 2}
        textAnchor="middle"
        fontSize={size * 0.22}
        fontWeight="800"
        fill="#1f1c18"
      >
        {toFa(clamped)}٪
      </text>
      <text
        x={cx}
        y={cx + size * 0.16}
        textAnchor="middle"
        fontSize={size * 0.1}
        fill="#a8a29e"
      >
        کاهش
      </text>
    </svg>
  );
}

// ---------- کامپوننت اصلی ----------
export default function PdfCompressor() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState<Quality>("medium");
  const [isWorking, setIsWorking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const patch = useCallback((id: string, p: Partial<FileItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const pdfs = Array.from(list).filter(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (pdfs.length === 0) return;
    setItems((prev) => [
      ...prev,
      ...pdfs.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        status: "idle" as Status,
        progress: 0,
      })),
    ]);
  }, []);

  useEffect(() => {
    const target = items.find((it) => it.status === "idle");
    if (!target) return;
    patch(target.id, { status: "estimating" });
    estimateOutput(target.file, quality)
      .then(({ numPages, estimatedSize }) =>
        patch(target.id, { status: "estimated", numPages, estimatedSize }),
      )
      .catch(() =>
        patch(target.id, { status: "error", error: "فایل خوانده نشد" }),
      );
  }, [items, quality, patch]);

  const changeQuality = useCallback(
    (q: Quality) => {
      if (isWorking) return;
      setQuality(q);
      setItems((prev) =>
        prev.map((it) =>
          it.status === "done" || it.status === "error"
            ? it
            : { ...it, status: "idle", estimatedSize: undefined },
        ),
      );
    },
    [isWorking],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it?.resultUrl) URL.revokeObjectURL(it.resultUrl);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const resetAll = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => it.resultUrl && URL.revokeObjectURL(it.resultUrl));
      return [];
    });
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const compressAll = useCallback(async () => {
    setIsWorking(true);
    const snapshot = items.filter((it) => it.status !== "done");
    for (const it of snapshot) {
      patch(it.id, { status: "compressing", progress: 0 });
      try {
        const blob = await compressPdf(it.file, quality, (done, total) => {
          patch(it.id, { progress: Math.round((done / total) * 100) });
        });
        const url = URL.createObjectURL(blob);
        patch(it.id, {
          status: "done",
          resultUrl: url,
          resultSize: blob.size,
          progress: 100,
        });
      } catch {
        patch(it.id, { status: "error", error: "خطا در پردازش فایل" });
      }
    }
    setIsWorking(false);
  }, [items, quality, patch]);

  const downloadAll = useCallback(() => {
    items.forEach((it) => {
      if (it.status === "done" && it.resultUrl) {
        const a = document.createElement("a");
        a.href = it.resultUrl;
        a.download = `${it.file.name.replace(/\.pdf$/i, "")}-compressed.pdf`;
        a.click();
      }
    });
  }, [items]);

  const totalOriginal = items.reduce((s, it) => s + it.file.size, 0);
  const doneItems = items.filter((it) => it.status === "done");
  const allDone = items.length > 0 && doneItems.length === items.length;
  const totalFinal = doneItems.reduce((s, it) => s + (it.resultSize || 0), 0);
  const totalEstimated = items.reduce(
    (s, it) => s + (it.estimatedSize ?? it.file.size),
    0,
  );
  const savedPercent = allDone
    ? Math.max(0, Math.round((1 - totalFinal / totalOriginal) * 100))
    : Math.max(0, Math.round((1 - totalEstimated / totalOriginal) * 100));

  return (
    <div className="w-full">
      {items.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all duration-300 ${
            isDragging
              ? "scale-[1.01] border-[#c63d22] bg-[#c63d22]/5"
              : "border-stone-300 bg-white/60 hover:border-[#c63d22]/60 hover:bg-white"
          }`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c63d22]/10 text-[#c63d22] transition-transform duration-300 group-hover:-translate-y-1">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 5 17 10" />
              <line x1="12" y1="5" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-stone-800">
              فایل‌های PDF را اینجا رها کنید
            </p>
            <p className="mt-1 text-sm text-stone-500">
              می‌توانید چند فایل را هم‌زمان انتخاب کنید — پردازش روی دستگاه شما
              انجام می‌شود
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {items.length > 0 && (
        <div className="space-y-5">
          {/* انتخاب کیفیت */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(Object.keys(QUALITY_SETTINGS) as Quality[]).map((q) => (
              <button
                key={q}
                disabled={isWorking}
                onClick={() => changeQuality(q)}
                className={`rounded-xl border-2 p-4 text-right transition-all disabled:opacity-50 ${
                  quality === q
                    ? "border-[#c63d22] bg-[#c63d22]/5"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <span className="block font-bold text-stone-800">
                  {QUALITY_SETTINGS[q].label}
                </span>
                <span className="mt-1 block text-xs text-stone-500">
                  {QUALITY_SETTINGS[q].hint}
                </span>
              </button>
            ))}
          </div>

          {/* لیست فایل‌ها */}
          <div className="space-y-3">
            {items.map((it) => {
              const noReductionEst =
                it.estimatedSize != null && it.estimatedSize >= it.file.size;
              const noReductionDone =
                it.resultSize != null && it.resultSize >= it.file.size;
              const itemSaved =
                it.status === "done" && it.resultSize != null
                  ? Math.max(
                      0,
                      Math.round((1 - it.resultSize / it.file.size) * 100),
                    )
                  : it.estimatedSize != null
                    ? Math.max(
                        0,
                        Math.round((1 - it.estimatedSize / it.file.size) * 100),
                      )
                    : 0;
              return (
                <div
                  key={it.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#c63d22]/10 text-[#c63d22]">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-stone-800">
                          {it.file.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {formatBytes(it.file.size)}
                          {it.numPages ? ` · ${toFa(it.numPages)} صفحه` : ""}
                        </p>
                      </div>
                    </div>
                    {!isWorking && (
                      <button
                        onClick={() => removeItem(it.id)}
                        className="shrink-0 text-stone-400 transition-colors hover:text-[#c63d22]"
                        aria-label="حذف"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="mt-3">
                    {it.status === "estimating" && (
                      <p className="text-sm text-stone-400">
                        در حال تخمین حجم…
                      </p>
                    )}

                    {it.status === "estimated" &&
                      it.estimatedSize != null &&
                      (noReductionEst ? (
                        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          این فایل از قبل بهینه است؛ کاهش محسوسی ممکن نیست.
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm">
                          <span className="text-stone-500">
                            حجم تقریبی پس از فشرده‌سازی
                          </span>
                          <span className="font-bold text-stone-700">
                            ≈ {formatBytes(it.estimatedSize)}{" "}
                            <span className="text-[#c63d22]">
                              ({toFa(itemSaved)}٪ کمتر)
                            </span>
                          </span>
                        </div>
                      ))}

                    {it.status === "compressing" && (
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-stone-500">
                          <span>در حال فشرده‌سازی…</span>
                          <span>{toFa(it.progress)}٪</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-[#c63d22] transition-all"
                            style={{ width: `${it.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {it.status === "done" &&
                      it.resultSize != null &&
                      (noReductionDone ? (
                        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          این فایل قابل کاهش بیشتر نبود؛ فایل اصلی بدون تغییر
                          باقی ماند.
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                          <span className="font-medium text-emerald-700">
                            {formatBytes(it.file.size)} ←{" "}
                            {formatBytes(it.resultSize)}{" "}
                            <span className="font-bold">
                              ({toFa(itemSaved)}٪)
                            </span>
                          </span>
                          <a
                            href={it.resultUrl}
                            download={`${it.file.name.replace(/\.pdf$/i, "")}-compressed.pdf`}
                            className="shrink-0 rounded-lg bg-[#c63d22] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#a8331c]"
                          >
                            دانلود
                          </a>
                        </div>
                      ))}

                    {it.status === "error" && (
                      <p className="text-sm font-medium text-red-600">
                        {it.error}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isWorking && (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-stone-300 py-3 text-sm font-bold text-stone-500 transition-colors hover:border-[#c63d22]/60 hover:text-[#c63d22]"
            >
              + افزودن فایل بیشتر
            </button>
          )}

          {/* جمع‌بندی + گراف */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-5">
              <Donut percent={savedPercent} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-stone-800">
                  {allDone
                    ? savedPercent > 0
                      ? "همهٔ فایل‌ها فشرده شدند!"
                      : "این فایل‌ها قابل کاهش بیشتر نبودند"
                    : "تخمین کاهش حجم"}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {formatBytes(totalOriginal)}{" "}
                  <span className="text-stone-400">←</span>{" "}
                  <span className="font-bold text-stone-800">
                    {allDone
                      ? formatBytes(totalFinal)
                      : `≈ ${formatBytes(totalEstimated)}`}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-stone-400">
                  {toFa(items.length)} فایل{allDone ? "" : " · تخمین تقریبی"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {!allDone ? (
                <button
                  onClick={compressAll}
                  disabled={isWorking}
                  className="flex-1 rounded-xl bg-[#c63d22] py-3.5 font-bold text-white shadow-sm transition-all hover:bg-[#a8331c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isWorking
                    ? "لطفاً صبر کنید…"
                    : `فشرده‌سازی ${toFa(items.length)} فایل`}
                </button>
              ) : (
                <button
                  onClick={downloadAll}
                  className="flex-1 rounded-xl bg-[#c63d22] py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-[#a8331c]"
                >
                  دانلود همه
                </button>
              )}
              <button
                onClick={resetAll}
                disabled={isWorking}
                className="rounded-xl border border-stone-300 bg-white px-6 py-3.5 font-bold text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
              >
                شروع دوباره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
