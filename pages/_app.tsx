import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>کاهش حجم pdf و فشرده سازی پی دی اف آنلاین</title>
        <meta
          name="description"
          content="کاهش حجم PDF به صورت آنلاین و رایگان. فایل‌های PDF خود را بدون افت کیفیت فشرده کنید و حجم پی دی اف را در چند ثانیه کم کنید. بدون نیاز به نصب نرم‌افزار و مناسب برای اندروید و ویندوز
"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
