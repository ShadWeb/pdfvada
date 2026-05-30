import { useCallback, useRef, useState } from "react";

type Quality = "high" | "medium" | "low";

interface CompressResult {
  url: string;
  blob: Blob;
  name: string;
  originalSize: number;
  compressedSize: number;
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
  low: { scale: 0.75, jpeg: 0.45, label: "حجم کم", hint: "بیشترین فشرده‌سازی" },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "۰ بایت";
  const units = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${value} ${units[i]}`;
}

async function compressPdf(
  file: File,
  quality: Quality,
  onProgress: (done: number, total: number) => void,
): Promise<Blob> {
  // وارد کردن داینامیک تا فقط سمت کلاینت بارگذاری شوند
  const pdfjsLib = await import("pdfjs-dist");
  const { jsPDF } = await import("jspdf");

  // ورکر را خود باندلر (Turbopack/Webpack) از داخل پکیج بسته‌بندی و از همین دامنه سرو می‌کند.
  // هیچ درخواست خارجی و هیچ کپی دستی در public لازم نیست.
  if (!pdfjsLib.GlobalWorkerOptions.workerPort) {
    pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
      new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
      { type: "module" },
    );
  }

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

    // پس‌زمینهٔ سفید تا صفحات شفاف، مشکی نشوند
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

    // آزادسازی حافظه
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();

    onProgress(pageNum, pdf.numPages);
  }

  if (!doc) throw new Error("این فایل صفحه‌ای ندارد");
  return doc.output("blob");
}

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<Quality>("medium");
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | undefined | null) => {
    setError(null);
    setResult(null);
    if (!f) return;
    if (
      f.type !== "application/pdf" &&
      !f.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("لطفاً فقط فایل PDF انتخاب کنید.");
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile],
  );

  const run = useCallback(async () => {
    if (!file) return;
    setIsWorking(true);
    setError(null);
    setResult(null);
    setProgress(0);
    try {
      const blob = await compressPdf(file, quality, (done, total) => {
        setProgress(Math.round((done / total) * 100));
      });
      const url = URL.createObjectURL(blob);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setResult({
        url,
        blob,
        name: `${baseName}-compressed.pdf`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (err) {
      console.error(err);
      setError("خطا در پردازش فایل. ممکن است فایل رمزدار یا خراب باشد.");
    } finally {
      setIsWorking(false);
    }
  }, [file, quality]);

  const reset = useCallback(() => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }, [result]);

  const savedPercent =
    result && result.originalSize > 0
      ? Math.max(
          0,
          Math.round((1 - result.compressedSize / result.originalSize) * 100),
        )
      : 0;

  return (
    <div className="w-full">
      {/* ناحیهٔ آپلود */}
      {!file && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
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
              فایل PDF را اینجا رها کنید
            </p>
            <p className="mt-1 text-sm text-stone-500">
              یا برای انتخاب کلیک کنید — پردازش روی دستگاه شما انجام می‌شود
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* فایل انتخاب‌شده + تنظیمات */}
      {file && !result && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#c63d22]/10 text-[#c63d22]">
                <svg
                  width="22"
                  height="22"
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
              <div className="overflow-hidden">
                <p className="truncate font-semibold text-stone-800">
                  {file.name}
                </p>
                <p className="text-sm text-stone-500">
                  {formatBytes(file.size)}
                </p>
              </div>
            </div>
            {!isWorking && (
              <button
                onClick={reset}
                className="shrink-0 text-sm text-stone-400 transition-colors hover:text-[#c63d22]"
              >
                حذف
              </button>
            )}
          </div>

          {/* انتخاب کیفیت */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(Object.keys(QUALITY_SETTINGS) as Quality[]).map((q) => (
              <button
                key={q}
                disabled={isWorking}
                onClick={() => setQuality(q)}
                className={`rounded-xl border-2 p-4 text-right transition-all disabled:opacity-50 ${
                  quality === q
                    ? "border-[#c63d22] bg-[#c63d22]/5"
                    : "border-stone-200 hover:border-stone-300"
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

          {/* نوار پیشرفت */}
          {isWorking && (
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm text-stone-600">
                <span>در حال فشرده‌سازی…</span>
                <span>{progress}٪</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-[#c63d22] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={run}
            disabled={isWorking}
            className="mt-6 w-full rounded-xl bg-[#c63d22] py-3.5 font-bold text-white shadow-sm transition-all hover:bg-[#a8331c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isWorking ? "لطفاً صبر کنید…" : "فشرده‌سازی فایل"}
          </button>
        </div>
      )}

      {/* نتیجه */}
      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-stone-800">فشرده‌سازی انجام شد</p>
              <p className="text-sm text-stone-600">{result.name}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-white p-3">
              <p className="text-xs text-stone-500">حجم اولیه</p>
              <p className="mt-1 font-bold text-stone-700">
                {formatBytes(result.originalSize)}
              </p>
            </div>
            <div className="rounded-xl bg-white p-3">
              <p className="text-xs text-stone-500">حجم نهایی</p>
              <p className="mt-1 font-bold text-stone-700">
                {formatBytes(result.compressedSize)}
              </p>
            </div>
            <div className="rounded-xl bg-[#c63d22] p-3 text-white">
              <p className="text-xs opacity-90">کاهش حجم</p>
              <p className="mt-1 font-bold">{savedPercent}٪</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href={result.url}
              download={result.name}
              className="flex-1 rounded-xl bg-[#c63d22] py-3 text-center font-bold text-white transition-colors hover:bg-[#a8331c]"
            >
              دانلود فایل
            </a>
            <button
              onClick={reset}
              className="flex-1 rounded-xl border border-stone-300 bg-white py-3 font-bold text-stone-700 transition-colors hover:bg-stone-50"
            >
              فایل جدید
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
