"use client";

// 레시피 카드 (제작대 스타일) — 원본 냉장고 레시피.dc.html 의 isCraft 블록.

import { dishIcon, iconBg } from "@/lib/icons";
import type { Recipe, UseRow } from "@/lib/types";

type Props = {
  recipe: Recipe;
  rows: UseRow[];
  missCount: number;
  active: boolean;
  isFav: boolean;
  onSelect: () => void;
};

export default function RecipeCard({
  recipe,
  rows,
  missCount,
  active,
  isFav,
  onSelect,
}: Props) {
  return (
    <div
      className="brighten-08"
      onClick={onSelect}
      style={{
        cursor: "pointer",
        background: active ? "#d9a36f" : "#9c5f36",
        border: "4px solid #3b2418",
        boxShadow: "inset 3px 3px 0 #6f3f22",
        padding: 10,
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          alignItems: "center",
          flex: "1 1 180px",
        }}
      >
        {rows.map((u, i) => (
          <div
            key={`${u.name}-${i}`}
            title={u.name}
            style={{
              position: "relative",
              width: 40,
              height: 40,
              background: u.bg,
              border: "3px solid #3b2418",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: u.op,
            }}
          >
            <div
              className="pixelated"
              style={{ width: 22, height: 22, background: iconBg(u.icon) }}
            />
            <span
              style={{
                position: "absolute",
                right: -5,
                bottom: -5,
                fontSize: 10,
                background: "#fff1d6",
                border: "2px solid #3b2418",
                padding: "0 2px",
                lineHeight: 1.2,
              }}
            >
              {u.mark}
            </span>
          </div>
        ))}
        <span
          style={{
            fontSize: 20,
            color: "#fff1d6",
            textShadow: "2px 2px 0 #3b2418",
            padding: "0 4px",
          }}
        >
          ▶
        </span>
        <div
          style={{
            width: 52,
            height: 52,
            background: "#cfd8e0",
            border: "4px solid #3b2418",
            boxShadow: "inset -3px -3px 0 #9aa7b4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="pixelated"
            style={{
              width: 30,
              height: 30,
              background: iconBg(dishIcon(recipe)),
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: "1 1 160px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "#fff1d6",
              textShadow: "2px 2px 0 #3b2418",
            }}
          >
            {recipe.name}
          </span>
          <span style={{ color: "#d8433b", fontSize: 16 }}>
            {isFav ? "♥" : ""}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <span
            style={{
              background: "#f7b733",
              border: "2px solid #3b2418",
              padding: "0 6px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            ⏱ {recipe.minutes}분
          </span>
          <span
            style={{
              background: "#cfd8e0",
              border: "2px solid #3b2418",
              padding: "0 6px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {recipe.difficulty}
          </span>
          <span
            style={{
              background: missCount ? "#f3b3ad" : "#a5e27f",
              border: "2px solid #3b2418",
              padding: "0 6px",
              fontSize: 11,
              fontWeight: 700,
              color: missCount ? "#9c2a24" : "#2d5a1c",
            }}
          >
            {missCount ? `없는 재료 ${missCount}` : "재료 다 있음"}
          </span>
        </div>
      </div>
    </div>
  );
}
