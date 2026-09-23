"use client";

// 냉장고 칸 탭 — 원본 냉장고 레시피.dc.html 의 isFridgeTab 블록.

import { useState, type CSSProperties } from "react";
import { dColor, dLabel, dLeft } from "@/lib/fridge";
import { iconBg, iconFor } from "@/lib/icons";
import { useGame } from "@/lib/game-state";

const input: CSSProperties = {
  minWidth: 0,
  fontFamily: "inherit",
  fontSize: 14,
  background: "#fff1d6",
  border: "4px solid #3b2418",
  boxShadow: "inset 3px 3px 0 #d9c2a0",
  color: "#3b2418",
  borderRadius: 0,
};

const stepBtn: CSSProperties = {
  width: 34,
  height: 34,
  cursor: "pointer",
  background: "#fff1d6",
  border: "3px solid #3b2418",
  fontSize: 16,
  fontWeight: 700,
  borderRadius: 0,
  color: "#3b2418",
};

const legend = (color: string, text: string) => (
  <span key={text} style={{ display: "flex", alignItems: "center", gap: 4 }}>
    <span
      style={{
        width: 10,
        height: 10,
        background: color,
        border: "2px solid #3b2418",
      }}
    />
    {text}
  </span>
);

export default function FridgeInventory() {
  const g = useGame();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [days, setDays] = useState("");
  const [selId, setSelId] = useState<string | null>(null);

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    const q = Math.max(1, parseInt(qty, 10) || 1);
    const d = days === "" ? 7 : Math.max(0, parseInt(days, 10) || 0);
    g.addItem(n, q, d);
    setName("");
    setQty("");
    setDays("");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
  };

  const sorted = [...g.items].sort((a, b) => a.exp - b.exp);
  const empties = Math.max(0, 12 - sorted.length);
  const selItem = g.items.find((i) => i.id === selId) ?? null;
  const sd = selItem ? dLeft(selItem) : 0;

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "stretch" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKey}
          placeholder="재료 이름 (예: 계란)"
          style={{ ...input, flex: "3 1 140px", padding: "10px 10px" }}
        />
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onKeyDown={onKey}
          type="number"
          min={1}
          placeholder="수량"
          style={{ ...input, flex: "1 1 56px", width: 60, padding: "10px 8px" }}
        />
        <input
          value={days}
          onChange={(e) => setDays(e.target.value)}
          onKeyDown={onKey}
          type="number"
          min={0}
          placeholder="기한(일)"
          style={{ ...input, flex: "1 1 72px", width: 72, padding: "10px 8px" }}
        />
        <button
          className="btn-green"
          onClick={submit}
          style={{
            flex: "0 0 auto",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
            padding: "8px 16px",
            background: "#6fbf4a",
            color: "#fff",
            textShadow: "2px 2px 0 #2d5a1c",
            border: "4px solid #3b2418",
            boxShadow: "inset -4px -4px 0 #3f8a2a, inset 4px 4px 0 #a5e27f",
            borderRadius: 0,
          }}
        >
          넣기 +
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(68px,1fr))",
          gap: 8,
        }}
      >
        {sorted.map((it) => {
          const d = dLeft(it);
          const selected = it.id === selId;
          return (
            <button
              key={it.id}
              className="brighten-12"
              onClick={() => setSelId(selected ? null : it.id)}
              title={it.name}
              style={{
                position: "relative",
                aspectRatio: "1/1",
                cursor: "pointer",
                padding: 0,
                background: selected ? "#d9a36f" : "#9c5f36",
                border: `4px solid ${selected ? "#f7b733" : "#3b2418"}`,
                boxShadow: "inset 4px 4px 0 #6f3f22, inset -3px -3px 0 #b77a4b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 0,
              }}
            >
              <div
                className="pixelated"
                style={{
                  width: "60%",
                  height: "60%",
                  background: iconBg(iconFor(it.name)),
                }}
              />
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  minWidth: 22,
                  height: 22,
                  boxSizing: "border-box",
                  padding: "0 4px",
                  background: "#fff1d6",
                  border: "3px solid #3b2418",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3b2418",
                }}
              >
                {it.qty}
              </span>
              <span
                style={{
                  position: "absolute",
                  left: -4,
                  bottom: -4,
                  padding: "1px 4px",
                  background: dColor(d),
                  border: "3px solid #3b2418",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.3,
                }}
              >
                {dLabel(d)}
              </span>
            </button>
          );
        })}
        {Array.from({ length: empties }, (_, i) => (
          <div
            key={`e${i}`}
            style={{
              aspectRatio: "1/1",
              background: "#9c5f36",
              border: "4px solid #7a4526",
              boxShadow: "inset 4px 4px 0 #7a4526",
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {selItem && (
        <div
          style={{
            position: "relative",
            background: "#cfd8e0",
            border: "4px solid #3b2418",
            boxShadow: "inset -4px -4px 0 #9aa7b4, inset 4px 4px 0 #eef2f5",
            padding: "12px 14px",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
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
                width: 30,
                height: 30,
                background: iconBg(iconFor(selItem.name)),
              }}
            />
          </div>
          <div
            style={{
              flex: "1 1 120px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700 }}>{selItem.name}</div>
            <div style={{ fontSize: 12, color: "#4a5468" }}>
              {sd < 0
                ? `유통기한 ${-sd}일 지남`
                : sd === 0
                  ? "오늘까지 먹어야 해요"
                  : `유통기한 D-${sd}`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              className="press-sm"
              onClick={() => {
                if (selItem.qty <= 1) setSelId(null);
                g.decItem(selItem.id);
              }}
              style={stepBtn}
            >
              −
            </button>
            <div
              style={{
                minWidth: 36,
                textAlign: "center",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {selItem.qty}
            </div>
            <button
              className="press-sm"
              onClick={() => g.incItem(selItem.id)}
              style={stepBtn}
            >
              +
            </button>
            <button
              className="press-sm"
              onClick={() => {
                g.removeItem(selItem.id);
                setSelId(null);
              }}
              style={{
                height: 34,
                cursor: "pointer",
                padding: "0 10px",
                background: "#d8433b",
                color: "#fff",
                border: "3px solid #3b2418",
                boxShadow: "inset -3px -3px 0 #9c2a24",
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 0,
              }}
            >
              버리기
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 12,
          color: "#fff1d6",
          textShadow: "1px 1px 0 #3b2418",
        }}
      >
        {legend("#d8433b", "D-1 이하")}
        {legend("#f0a020", "D-3 이하")}
        {legend("#5aa83c", "여유")}
        <span>· 칸을 눌러 수량 조절</span>
      </div>
    </>
  );
}
