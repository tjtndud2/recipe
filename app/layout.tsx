import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/lib/game-state";

export const metadata: Metadata = {
  title: "냉장고 RPG — 자취생의 오늘 한 끼 퀘스트",
  description:
    "냉장고에 있는 재료로 오늘 뭘 먹을지 골라주는 픽셀 RPG. 재료를 넣고 AI 추천을 받아 요리하면 레벨이 오른다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <head>
        {/* 원본과 동일한 픽셀 폰트 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css"
        />
      </head>
      <body>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
