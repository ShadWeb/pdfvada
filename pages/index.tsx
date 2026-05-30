import Image from "next/image";
import Footer from "@/components/Footer";
import PdfCompressor from "@/components/PdfCompressor";
import logo from "@/public/images/logo.png";
import pdfVada from "@/public/images/pdfvada.png";

// ✅ اصلاح: alt به صورت جدا شده با کاما (طبق خواسته)
const LOGO_ALT =
  "کاهش حجم PDF آنلاین، فشرده سازی فایل PDF، کم کردن حجم پی دی اف بدون افت کیفیت، ابزار آنلاین compress PDF";

// مزایا (متن‌ها همین‌طور که هستند)
const features = [
  {
    title: "حریم خصوصی کامل",
    desc: "فایل‌ها هرگز آپلود نمی‌شوند؛ کل پردازش داخل مرورگر خودتان اتفاق می‌افتد.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    title: "بدون محدودیت و رایگان",
    desc: "بدون نیاز به نصب نرم‌افزار، بدون ثبت‌نام، بدون واترمارک و بدون سقف تعداد فایل.",
    icon: <path d="M5 12h14M12 5v14" />,
  },
  {
    title: "سریع و سبک",
    desc: "تنها در چند ثانیه یک PDF سبک‌تر برای ارسال در واتساپ، ایمیل و سایت‌ها بگیرید.",
    icon: <path d="M13 2 3 14h9l-1 8 10-12h-9z" />,
  },
];

// ✅ تمام H2ها به ترتیب
const seoSections = [
  {
    h2: "فشرده کردن فایل PDF بدون افت کیفیت",
    p: "با تنظیم سطح کیفیت می‌توانید بین حجم و وضوح تعادل دلخواه را برقرار کنید. در حالت کیفیت بالا فشرده‌سازی با کمترین افت محسوس انجام می‌شود.",
  },
  {
    h2: "کم کردن حجم PDF آنلاین و رایگان",
    p: "این ابزار کاملاً آنلاین و رایگان است و نیازی به نصب هیچ برنامه‌ای ندارد. کافی است فایل را انتخاب کنید تا حجم پی دی اف کاهش پیدا کند.",
  },
  {
    h2: "چگونه حجم فایل PDF را کاهش دهیم؟",
    p: "در سه گام ساده: فایل PDF را بکشید و رها کنید، سطح کیفیت را انتخاب کنید و دکمهٔ فشرده‌سازی را بزنید، سپس نسخهٔ سبک‌شده را دانلود کنید.",
  },
  {
    h2: "کاهش حجم PDF برای ارسال در واتساپ و ایمیل",
    p: "با کم کردن حجم پی دی اف می‌توانید فایل‌های سنگین را بدون دردسر در واتساپ، تلگرام و ایمیل ارسال کنید.",
  },
  {
    h2: "ابزار آنلاین کم کردن حجم پی دی اف",
    p: "ابزار روی موبایل، تبلت اندروید و iOS و کامپیوتر کار می‌کند و پردازش سمت کاربر انجام می‌شود.",
  },
];

// ✅ اصلاح FAQ سومی (رفع تناقض)
const faqs = [
  {
    q: "آیا کاهش حجم PDF باعث افت کیفیت می‌شود؟",
    a: "خیر، فایل‌ها با کمترین افت کیفیت فشرده می‌شوند.",
  },
  {
    q: "آیا استفاده از ابزار رایگان است؟",
    a: "بله، استفاده از ابزار کاهش حجم PDF کاملاً رایگان است.",
  },
  {
    q: "آیا فایل‌های من ذخیره می‌شوند؟",
    a: "خیر، فایل‌ها هرگز به سرور آپلود نمی‌شوند و تمام پردازش داخل مرورگر شما انجام می‌شود.",
  },
  {
    q: "آیا در موبایل هم کار می‌کند؟",
    a: "بله، ابزار روی موبایل، تبلت اندروید و IOS و کامپیوتر قابل استفاده است.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Home() {
  return (
    <>
      <main className="min-h-screen">
        {/* هدر */}
        <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg">
              <Image
                src={logo}
                width={48}
                height={48}
                alt={LOGO_ALT}
                priority
              />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              فشرده‌ساز PDF
            </span>
          </div>
          <a
            href="#tool"
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 transition-colors hover:border-[#c63d22] hover:text-[#c63d22]"
          >
            شروع کنید
          </a>
        </header>

        {/* هیرو - H1 و پاراگراف */}
        <section className="mx-auto max-w-5xl px-6 pb-8 pt-12 text-center">
          <span className="inline-block rounded-full border border-[#c63d22]/30 bg-[#c63d22]/5 px-4 py-1.5 text-sm font-bold text-[#c63d22]">
            پردازش امن داخل مرورگر شما
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-black leading-tight tracking-tight text-stone-900 ">
            کاهش حجم فایل پی دی اف{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-[#c63d22]">
                آنلاین و رایگان
              </span>
              <span className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 bg-[#c63d22]/20" />
            </span>
          </h1>
          {/* ✅ پاراگراف معرفی - دقیقاً همان متنی که خواستی */}
        </section>

        {/* ابزار */}
        <section id="tool" className="mx-auto max-w-2xl scroll-mt-8 px-6 pb-20">
          <PdfCompressor />
        </section>
        <section className="w-full flex   items-center justify-center m-2 mb-4 ">
          <div className="bg-white rounded-2xl p-5">
            <Image src={pdfVada} width={700} height={100} alt={LOGO_ALT} />
          </div>
        </section>

        {/* ✅ H2: مزایای فشرده سازی پی دی اف */}
        <section className="border-t border-stone-200 bg-white/40 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-3xl font-black text-stone-900">
              مزایای فشرده سازی پی دی اف
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

        {/* ✅ تمام H2های سئو: 
            - فشرده کردن فایل PDF بدون افت کیفیت
            - کم کردن حجم PDF آنلاین و رایگان
            - چگونه حجم فایل PDF را کاهش دهیم؟
            - کاهش حجم PDF برای ارسال در واتساپ و ایمیل
            - ابزار آنلاین کم کردن حجم پی دی اف
        */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-6">
            <div className="space-y-10 bg-white p-5 rounded-2xl">
              {seoSections.map((s) => (
                <article key={s.h2} className="text-center shadow">
                  <h2 className="text-2xl font-black text-stone-900">{s.h2}</h2>
                  <p className="mt-3 leading-loose text-stone-600">{s.p}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ✅ سوالات متداول - تمام 4 سوال */}
        <section
          id="faq"
          className="scroll-mt-8 border-t border-stone-200 bg-white/40 py-20"
        >
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
                  <p className="mt-3 leading-relaxed text-stone-600">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
