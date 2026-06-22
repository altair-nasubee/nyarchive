import type { Metadata } from "next";
import {
  Geist_Mono,
  Zen_Kaku_Gothic_New,
  Zen_Maru_Gothic,
} from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

// 本文・UI: クリーンな和文ゴシック
const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// 見出し・ロゴ: 丸くて親しみやすい和文（このアプリの人格）
const zenMaru = Zen_Maru_Gothic({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// 図鑑番号・日付などの表記
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nyarchive — みんなのねこ図鑑",
  description:
    "飼い猫のプロフィールと写真を、ねこ図鑑として集めて公開・閲覧できるアプリ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${zenKaku.variable} ${zenMaru.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
