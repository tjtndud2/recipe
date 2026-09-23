import type { CSSProperties, ReactNode } from "react";

// 원본 세 화면이 공유하던 바깥 셸. 체커보드 배경 + 1140px 중앙 정렬 컬럼.
// PC 전용이므로 max-width 대신 고정 width 를 쓴다.

const shell: CSSProperties = {
  minHeight: "100vh",
  background:
    "repeating-conic-gradient(#86cb62 0 25%, #7cc159 0 50%) 0 0/48px 48px",
  fontFamily: "'Galmuri11','Galmuri9',monospace",
  color: "#3b2418",
  padding: "24px 14px 64px",
  boxSizing: "border-box",
  fontSize: 14,
  lineHeight: 1.5,
};

const column: CSSProperties = {
  width: 1140,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

export default function PixelScreen({ children }: { children: ReactNode }) {
  return (
    <div style={shell}>
      <div style={column}>{children}</div>
    </div>
  );
}
