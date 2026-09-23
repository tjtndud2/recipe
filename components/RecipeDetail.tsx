"use client";

// 레시피 상세 — 원본 냉장고 레시피.dc.html 의 hasSel 블록.

import { dishIcon, iconBg } from "@/lib/icons";
import type { Recipe, UseRow } from "@/lib/types";

type Props = {
  recipe: Recipe;
  rows: UseRow[];
  missCount: number;
  isFav: boolean;
  onToggleFav: () => void;
  onCook: () => void;
  onClose: () => void;
};

export default function RecipeDetail({
  recipe,
  rows,
  missCount,
  isFav,
  onToggleFav,
  onCook,
  onClose,
}: Props) {
  return (
    <div
      style={{
        background: "#cfd8e0",
        border: "4px solid #3b2418",
        boxShadow:
          "inset -4px -4px 0 #9aa7b4, inset 4px 4px 0 #eef2f5, 4px 4px 0 rgba(40,20,10,.35)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            flexShrink: 0,
            background: "#b9794a",
            border: "4px solid #3b2418",
            boxShadow: "inset 3px 3px 0 #8d5330",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="pixelated"
            style={{
              width: 32,
              height: 32,
              background: iconBg(dishIcon(recipe)),
            }}
          />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 19, fontWeight: 700 }}>{recipe.name}</div>
          <div style={{ fontSize: 12, color: "#4a5468" }}>
            ⏱ {recipe.minutes}분 · {recipe.difficulty} ·{" "}
            {missCount ? `없는 재료 ${missCount}개` : "재료 다 있음"}
          </div>
        </div>
        <button
          className="press-sm"
          onClick={onToggleFav}
          aria-label="즐겨찾기"
          style={{
            cursor: "pointer",
            width: 42,
            height: 42,
            background: "#fff1d6",
            border: "3px solid #3b2418",
            fontSize: 20,
            color: "#d8433b",
            borderRadius: 0,
          }}
        >
          {isFav ? "♥" : "♡"}
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {rows.map((u, i) => (
          <span
            key={`${u.name}-${i}`}
            style={{
              background: u.chipBg,
              border: "2px solid #3b2418",
              padding: "2px 8px",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              className="pixelated"
              style={{
                width: 18,
                height: 18,
                flexShrink: 0,
                background: iconBg(u.icon),
              }}
            />
            {u.name} {u.amountText}
          </span>
        ))}
      </div>

      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {(recipe.steps || []).map((text, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: 8,
              fontSize: 13,
              textWrap: "pretty",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                background: "#3b2418",
                color: "#f7b733",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ol>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          className="btn-green"
          onClick={onCook}
          style={{
            flex: "1 1 180px",
            cursor: "pointer",
            padding: "10px 14px",
            background: "#6fbf4a",
            color: "#fff",
            textShadow: "2px 2px 0 #2d5a1c",
            border: "4px solid #3b2418",
            boxShadow: "inset -4px -4px 0 #3f8a2a, inset 4px 4px 0 #a5e27f",
            fontSize: 15,
            fontWeight: 700,
            borderRadius: 0,
          }}
        >
          🍳 요리 완료 · 재료 차감
        </button>
        <button
          className="press"
          onClick={onClose}
          style={{
            cursor: "pointer",
            padding: "10px 14px",
            background: "#fff1d6",
            border: "4px solid #3b2418",
            fontSize: 14,
            fontWeight: 700,
            borderRadius: 0,
            color: "#3b2418",
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
