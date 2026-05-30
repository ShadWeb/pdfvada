import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>فشرده‌ساز PDF | کاهش حجم آنلاین و امن</title>
        <meta
          name="description"
          content="حجم فایل‌های PDF خود را بدون آپلود روی سرور کاهش دهید. پردازش کاملاً روی مرورگر شما انجام می‌شود."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
