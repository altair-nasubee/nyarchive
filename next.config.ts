import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発時のインジケーターを非表示（ヘッダー/BottomBar とどの角でも重なるため）。
  // 非表示でもコンパイル/実行時エラーは引き続き表示される。
  // 位置を変えたい場合は false の代わりに { position: "bottom-right" } 等にする。
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        // Google アカウントのプロフィール画像
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
