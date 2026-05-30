import PdfCompressor from "@/components/PdfCompressor";

const features = [
  {
    title: "حریم خصوصی کامل",
    desc: "فایل‌ها هرگز آپلود نمی‌شوند؛ کل پردازش داخل مرورگر خودتان اتفاق می‌افتد.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    title: "بدون محدودیت",
    desc: "بدون نیاز به ثبت‌نام، بدون واترمارک و بدون سقف تعداد فایل.",
    icon: <path d="M5 12h14M12 5v14" />,
  },
  {
    title: "سریع و رایگان",
    desc: "تنها چند ثانیه تا یک PDF سبک‌تر و قابل‌اشتراک‌گذاری.",
    icon: <path d="M13 2 3 14h9l-1 8 10-12h-9z" />,
  },
];

const faqs = [
  {
    q: "آیا فایل من جایی آپلود می‌شود؟",
    a: "خیر. تمام عملیات فشرده‌سازی به‌صورت محلی و در مرورگر شما انجام می‌شود و هیچ داده‌ای به سرور ارسال نمی‌شود.",
  },
  {
    q: "بهترین حالت برای فشرده‌سازی کدام است؟",
    a: "برای فایل‌های اسکن‌شده و عکس‌محور، نتیجه عالی است. حالت «متعادل» برای اکثر کاربردها مناسب است؛ برای کمترین حجم از «حجم کم» استفاده کنید.",
  },
  {
    q: "آیا متن PDF قابل انتخاب باقی می‌ماند؟",
    a: "در این روش هر صفحه به تصویر تبدیل می‌شود تا حجم به‌خوبی کاهش یابد، بنابراین متن دیگر قابل انتخاب یا جست‌وجو نخواهد بود.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* هدر */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c63d22] font-black text-white">
            PDF
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            فشرده‌ساز
          </span>
        </div>
        <a
          href="#tool"
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 transition-colors hover:border-[#c63d22] hover:text-[#c63d22]"
        >
          شروع کنید
        </a>
      </header>

      {/* هیرو */}
      <section className="mx-auto max-w-5xl px-6 pb-8 pt-12 text-center">
        <span className="inline-block rounded-full border border-[#c63d22]/30 bg-[#c63d22]/5 px-4 py-1.5 text-sm font-bold text-[#c63d22]">
          پردازش امن داخل مرورگر شما
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-stone-900 sm:text-6xl">
          حجم فایل‌های
          <span className="relative mx-2 inline-block">
            <span className="relative z-10 text-[#c63d22]">PDF</span>
            <span className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 bg-[#c63d22]/20" />
          </span>
          را آب کنید
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600">
          فایل سنگین را بکشید و رها کنید، کیفیت دلخواه را انتخاب کنید و در چند
          ثانیه یک نسخهٔ سبک‌تر بگیرید — بدون آپلود، بدون ثبت‌نام.
        </p>
      </section>

      {/* ابزار */}
      <section id="tool" className="mx-auto max-w-2xl scroll-mt-8 px-6 pb-20">
        <PdfCompressor />
      </section>

      {/* ویژگی‌ها */}
      <section className="border-t border-stone-200 bg-white/40 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-black text-stone-900">
            چرا این ابزار؟
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-200 bg-white p-6 transition-transform hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c63d22]/10 text-[#c63d22]">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-stone-800">
                  {f.title}
                </h3>
                <p className="mt-2 text-stone-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* سوالات متداول */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-center text-3xl font-black text-stone-900">
            سوالات متداول
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-stone-200 bg-white p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-stone-800">
                  {item.q}
                  <span className="text-[#c63d22] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-stone-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* فوتر */}
      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        ساخته‌شده با Next.js — تمام پردازش‌ها روی دستگاه شما انجام می‌شود.
      </footer>
    </main>
  );
}
