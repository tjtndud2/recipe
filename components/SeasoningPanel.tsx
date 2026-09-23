"use client";

// 양념 & 조미료 탭 — 원본 냉장고 레시피.dc.html 의 isSeasonTab 블록.

import { S_COLOR, SEASONINGS } from "@/lib/constants";
import { useGame } from "@/lib/game-state";

export default function SeasoningPanel() {
  const g = useGame();
  const owned = SEASONINGS.filter((n) => g.seasonings[n]).length;

  const smallBtn = {
    cursor: "pointer",
    padding: "6px 12px",
    background: "#fff1d6",
    border: "3px solid #3b2418",
    boxShadow: "inset -3px -3px 0 #d9c2a0",
    fontSize: 13,
    fontWeight: 700,
    color: "#3b2418",
    borderRadius: 0,
  } as const;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#fff1d6",
            textShadow: "1px 1px 0 #3b2418",
            whiteSpace: "nowrap",
          }}
        >
          있는 양념을 체크하면 AI가 레시피에 써요
        </span>
        <span
          style={{
            background: "#3b2418",
            color: "#f7b733",
            padding: "2px 8px",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {owned}/{SEASONINGS.length} 보유
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(122px,1fr))",
          gap: 8,
        }}
      >
        {SEASONINGS.map((n) => {
          const on = !!g.seasonings[n];
          return (
            <button
              key={n}
              className="brighten-08 press"
              onClick={() => g.toggleSeasoning(n)}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 8,
                background: on ? "#fff1d6" : "#9c5f36",
                border: `4px solid ${on ? "#3b2418" : "#6f3f22"}`,
                boxShadow: on
                  ? "inset -3px -3px 0 #d9c2a0"
                  : "inset 3px 3px 0 #6f3f22",
                fontSize: 13,
                fontWeight: 700,
                color: on ? "#3b2418" : "#e2c29a",
                textAlign: "left",
                borderRadius: 0,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 18,
                  flexShrink: 0,
                  background: S_COLOR[n],
                  border: "2px solid #3b2418",
                  boxShadow: "inset 0 4px 0 #3b2418",
                }}
              />
              <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}>
                {n}
              </span>
              <span
                style={{
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  background: "#fff1d6",
                  border: "2px solid #3b2418",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  lineHeight: 1,
                  color: "#3b2418",
                }}
              >
                {on ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="press-sm"
          onClick={() => g.setAllSeasonings(true)}
          style={smallBtn}
        >
          전체 선택
        </button>
        <button
          className="press-sm"
          onClick={() => g.setAllSeasonings(false)}
          style={smallBtn}
        >
          전체 해제
        </button>
      </div>
    </>
  );
}
