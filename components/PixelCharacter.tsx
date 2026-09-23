import { CHAR, LEGS } from "@/lib/constants";

// 원본 cells(f): CHAR 12행 + LEGS[frame] 2행을 이어 붙여 10열 그리드로 그린다.

type Props = {
  shirt: string;
  /** 걷기 프레임 0~3 */
  frame?: number;
  /** 그리드 전체 너비(px) */
  width: number;
  /** 초상화처럼 위쪽 일부만 쓸 때의 셀 개수 (원본 portraitCells 는 100) */
  cellLimit?: number;
  transform?: string;
  filter?: string;
};

export function characterCells(shirt: string, frame: number): string[] {
  const pal: Record<string, string> = {
    H: "#3b2418",
    S: "#f3c9a0",
    E: "#1d1f20",
    M: "#c46a5a",
    T: shirt,
    P: "#3f5a8a",
    B: "#2a180f",
  };
  return [...CHAR, ...LEGS[frame]]
    .join("")
    .split("")
    .map((ch) => pal[ch] || "transparent");
}

export default function PixelCharacter({
  shirt,
  frame = 0,
  width,
  cellLimit,
  transform,
  filter,
}: Props) {
  const all = characterCells(shirt, frame);
  const cells = cellLimit ? all.slice(0, cellLimit) : all;

  return (
    <div
      style={{
        width,
        display: "grid",
        gridTemplateColumns: "repeat(10,1fr)",
        transform,
        filter,
      }}
    >
      {cells.map((c, i) => (
        <div key={i} style={{ aspectRatio: "1/1", background: c }} />
      ))}
    </div>
  );
}
