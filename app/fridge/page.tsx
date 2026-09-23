"use client";

// 냉장고 + AI 레시피 — 원본 냉장고 레시피.dc.html 의 isFridge 블록.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import PixelScreen from "@/components/PixelScreen";
import FridgeInventory from "@/components/FridgeInventory";
import SeasoningPanel from "@/components/SeasoningPanel";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetail from "@/components/RecipeDetail";
import { DIFFS, SEASONINGS, TIMES } from "@/lib/constants";
import { dLeft, ingredientRows, missCount as calcMiss } from "@/lib/fridge";
import { iconBg, dishIcon } from "@/lib/icons";
import { useGame } from "@/lib/game-state";
import { requestRecipes } from "@/lib/recipe";
import type { Recipe } from "@/lib/types";

const panel: CSSProperties = {
  background: "#b9794a",
  border: "4px solid #3b2418",
  boxShadow:
    "inset -4px -4px 0 #8d5330, inset 4px 4px 0 #d9a36f, 4px 4px 0 rgba(40,20,10,.35)",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const counter: CSSProperties = {
  background: "#cfd8e0",
  border: "4px solid #3b2418",
  boxShadow: "inset -4px -4px 0 #9aa7b4, 4px 4px 0 rgba(40,20,10,.35)",
  padding: "8px 16px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 84,
};

const filterLabel: CSSProperties = {
  minWidth: 64,
  fontWeight: 700,
  color: "#fff1d6",
  textShadow: "2px 2px 0 #3b2418",
};

export default function FridgePage() {
  const router = useRouter();
  const g = useGame();

  const [leftTab, setLeftTab] = useState<"fridge" | "season">("fridge");
  const [tab, setTab] = useState<"recipes" | "favs">("recipes");
  const [time, setTime] = useState("전체");
  const [diff, setDiff] = useState("전체");
  const [minMissing, setMinMissing] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sel, setSel] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blink, setBlink] = useState(0);

  const blinkTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 원본 fridge 씬 키 핸들러: Escape → 방으로
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = (e.target as HTMLElement | null)?.tagName;
      if (t === "INPUT" || t === "TEXTAREA") return;
      if (e.key.toLowerCase() === "escape") router.push("/room");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(
    () => () => {
      if (blinkTimer.current) clearInterval(blinkTimer.current);
    },
    []
  );

  const recommend = async () => {
    if (!g.items.length) {
      setError("냉장고가 비어 있어요. 재료를 먼저 넣어주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setSel(null);
    blinkTimer.current = setInterval(
      () => setBlink((b) => (b + 1) % 4),
      300
    );
    try {
      const result = await requestRecipes({
        items: g.items.map((i) => ({
          name: i.name,
          qty: i.qty,
          daysLeft: Math.max(0, dLeft(i)),
        })),
        seasonings: SEASONINGS.filter((n) => g.seasonings[n]),
        time,
        diff,
        minMissing,
      });
      setRecipes(result.slice(0, 3));
      setTab("recipes");
    } catch {
      setError("추천을 불러오지 못했어요. 다시 눌러주세요.");
    }
    if (blinkTimer.current) clearInterval(blinkTimer.current);
    setLoading(false);
  };

  const onCook = () => {
    if (!sel) return;
    const n = g.cook(sel);
    g.showToast(`🍳 ${sel.name} 완성! 재료 ${n}종 차감 · EXP +30`);
    setSel(null);
  };

  const onToggleFav = () => {
    if (!sel) return;
    const added = g.toggleFav(sel);
    g.showToast(added ? `♥ ${sel.name} 즐겨찾기 추가` : "즐겨찾기에서 뺐어요");
  };

  if (!g.hydrated) return <PixelScreen>{null}</PixelScreen>;

  const urgentCount = g.items.filter((i) => dLeft(i) <= 3).length;
  const showEmptyRecipes = !loading && !recipes.length && !error;

  const leftTabBtn = (id: "fridge" | "season", label: string, icon?: boolean) => {
    const on = leftTab === id;
    return (
      <button
        onClick={() => setLeftTab(id)}
        style={{
          cursor: "pointer",
          background: on ? "#b9794a" : "#8d5330",
          border: "4px solid #3b2418",
          borderBottom: "none",
          boxShadow: "inset 4px 4px 0 rgba(255,255,255,.25)",
          padding: "6px 16px 4px",
          fontWeight: 700,
          color: on ? "#fff1d6" : "#e2c29a",
          textShadow: "2px 2px 0 #3b2418",
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderRadius: 0,
        }}
      >
        {icon && (
          <div
            className="pixelated"
            style={{
              width: 30,
              height: 30,
              background: iconBg("/assets/fridge-icon-cream.png"),
            }}
          />
        )}
        {label}
      </button>
    );
  };

  const optBtn = (
    value: string,
    current: string,
    onClick: () => void,
    key: string
  ) => (
    <button
      key={key}
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "5px 10px",
        background: current === value ? "#f7b733" : "#fff1d6",
        color: "#3b2418",
        border: "3px solid #3b2418",
        boxShadow:
          current === value
            ? "inset -3px -3px 0 #c47d12"
            : "inset -3px -3px 0 #d9c2a0",
        fontSize: 13,
        fontWeight: 700,
        borderRadius: 0,
      }}
    >
      {value}
    </button>
  );

  return (
    <PixelScreen>
      {/* 헤더 */}
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        <button
          className="btn-cream"
          onClick={() => router.push("/room")}
          style={{
            cursor: "pointer",
            flex: "0 0 auto",
            padding: "0 16px",
            background: "#fff1d6",
            border: "4px solid #3b2418",
            boxShadow:
              "inset -4px -4px 0 #d9c2a0, 4px 4px 0 rgba(40,20,10,.35)",
            fontSize: 15,
            fontWeight: 700,
            color: "#3b2418",
            borderRadius: 0,
            minHeight: 48,
          }}
        >
          ◀ 방으로
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#b9794a",
            border: "4px solid #3b2418",
            boxShadow:
              "inset -4px -4px 0 #8d5330, inset 4px 4px 0 #d9a36f, 4px 4px 0 rgba(40,20,10,.35)",
            padding: "10px 18px",
            flex: "1 1 320px",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: "#8d5330",
              border: "4px solid #3b2418",
              boxShadow: "inset -3px -3px 0 #6f3f22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              className="pixelated"
              style={{
                width: 36,
                height: 36,
                background: iconBg("/assets/fridge-icon-cream.png"),
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "'Galmuri11',monospace",
                fontWeight: 700,
                fontSize: 22,
                color: "#fff1d6",
                textShadow: "2px 2px 0 #3b2418",
              }}
            >
              자취 냉장고
            </div>
            <div
              style={{ color: "#3b2418", fontSize: 13, whiteSpace: "nowrap" }}
            >
              재료를 넣으면 AI가 오늘 메뉴를 골라줘요
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flex: "0 1 auto" }}>
          <div style={counter}>
            <div style={{ fontSize: 12, color: "#4a5468" }}>재료</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {g.items.length}
              <span style={{ fontSize: 13 }}>종</span>
            </div>
          </div>
          <div style={counter}>
            <div style={{ fontSize: 12, color: "#4a5468" }}>임박 D-3</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#c0322b" }}>
              {urgentCount}
              <span style={{ fontSize: 13, color: "#3b2418" }}>개</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* 왼쪽 */}
        <div
          style={{
            flex: "1 1 360px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {leftTabBtn("fridge", "냉장고 칸", true)}
              {leftTabBtn("season", "양념 & 조미료")}
            </div>
          </div>
          <div style={panel}>
            {leftTab === "fridge" ? <FridgeInventory /> : <SeasoningPanel />}
          </div>
        </div>

        {/* 오른쪽 */}
        <div
          style={{
            flex: "1.35 1 420px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {(
              [
                ["recipes", "✨ AI 추천"],
                ["favs", `♥ 즐겨찾기 ${g.favs.length}`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  cursor: "pointer",
                  background: tab === id ? "#b9794a" : "#8d5330",
                  border: "4px solid #3b2418",
                  borderBottom: "none",
                  padding: "6px 16px 4px",
                  fontWeight: 700,
                  fontSize: 16,
                  color: tab === id ? "#fff1d6" : "#e2c29a",
                  textShadow: tab === id ? "2px 2px 0 #3b2418" : "none",
                  borderRadius: 0,
                  boxShadow: "inset 4px 4px 0 rgba(255,255,255,.25)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={panel}>
            {tab === "recipes" && (
              <>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <span style={filterLabel}>조리시간</span>
                    {TIMES.map((v) =>
                      optBtn(v, time, () => setTime(v), `t${v}`)
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <span style={filterLabel}>난이도</span>
                    {DIFFS.map((v) =>
                      optBtn(v, diff, () => setDiff(v), `d${v}`)
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <span style={filterLabel}>장보기</span>
                    <button
                      onClick={() => setMinMissing((v) => !v)}
                      style={{
                        cursor: "pointer",
                        padding: "5px 10px",
                        background: minMissing ? "#f7b733" : "#fff1d6",
                        color: "#3b2418",
                        border: "3px solid #3b2418",
                        fontSize: 13,
                        fontWeight: 700,
                        borderRadius: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          background: "#fff1d6",
                          border: "2px solid #3b2418",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          lineHeight: 1,
                        }}
                      >
                        {minMissing ? "✓" : ""}
                      </span>
                      없는 재료 최소화
                    </button>
                  </div>
                </div>

                <button
                  className="btn-yellow"
                  onClick={recommend}
                  disabled={loading}
                  style={{
                    cursor: "pointer",
                    width: "100%",
                    padding: "12px 16px",
                    background: "#f7b733",
                    border: "4px solid #3b2418",
                    boxShadow:
                      "inset -4px -4px 0 #c47d12, inset 4px 4px 0 #ffe08a",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#3b2418",
                    borderRadius: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  ✨{" "}
                  {loading
                    ? "추천 중..."
                    : recipes.length
                      ? "다시 추천받기"
                      : "AI 레시피 추천받기"}
                </button>

                {loading && (
                  <div
                    style={{
                      background: "#3b2418",
                      color: "#fff1d6",
                      padding: 14,
                      border: "4px solid #2a180f",
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        letterSpacing: 2,
                        color: "#f7b733",
                        minWidth: 36,
                        display: "inline-block",
                      }}
                    >
                      {"■".repeat(blink + 1)}
                    </span>
                    <span>
                      냉장고를 뒤지는 중... 임박 재료부터 쓰는 메뉴를 찾고 있어요
                    </span>
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      background: "#fff1d6",
                      border: "4px solid #d8433b",
                      padding: "10px 12px",
                      color: "#9c2a24",
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </div>
                )}

                {showEmptyRecipes && (
                  <div
                    style={{
                      background: "#9c5f36",
                      border: "4px dashed #6f3f22",
                      padding: 22,
                      textAlign: "center",
                      color: "#fff1d6",
                      textShadow: "1px 1px 0 #3b2418",
                      fontSize: 13,
                    }}
                  >
                    조건을 고르고 추천 버튼을 누르면 레시피 3개가 나와요
                  </div>
                )}

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {recipes.map((r) => (
                    <RecipeCard
                      key={r.name}
                      recipe={r}
                      rows={ingredientRows(r, g.items, g.seasonings)}
                      missCount={calcMiss(r, g.items, g.seasonings)}
                      active={sel?.name === r.name}
                      isFav={g.isFav(r)}
                      onSelect={() =>
                        setSel(sel?.name === r.name ? null : r)
                      }
                    />
                  ))}
                </div>
              </>
            )}

            {tab === "favs" && (
              <>
                {!g.favs.length && (
                  <div
                    style={{
                      background: "#9c5f36",
                      border: "4px dashed #6f3f22",
                      padding: 22,
                      textAlign: "center",
                      color: "#fff1d6",
                      textShadow: "1px 1px 0 #3b2418",
                      fontSize: 13,
                    }}
                  >
                    레시피 상세에서 ♥를 누르면 여기에 모여요
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
                    gap: 8,
                  }}
                >
                  {g.favs.map((f) => {
                    const mc = calcMiss(f, g.items, g.seasonings);
                    const active = sel?.name === f.name;
                    return (
                      <div
                        key={f.name}
                        className="brighten-10"
                        onClick={() => setSel(active ? null : f)}
                        style={{
                          cursor: "pointer",
                          background: active ? "#d9a36f" : "#9c5f36",
                          border: "4px solid #3b2418",
                          boxShadow: "inset 3px 3px 0 #6f3f22",
                          padding: 10,
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            flexShrink: 0,
                            background: "#cfd8e0",
                            border: "3px solid #3b2418",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            className="pixelated"
                            style={{
                              width: 22,
                              height: 22,
                              background: iconBg(dishIcon(f)),
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#fff1d6",
                              textShadow: "1px 1px 0 #3b2418",
                              fontSize: 14,
                            }}
                          >
                            {f.name}
                          </span>
                          <span style={{ fontSize: 11, color: "#3b2418" }}>
                            {mc ? `없는 재료 ${mc}개` : "지금 만들 수 있어요"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {sel && (
              <RecipeDetail
                recipe={sel}
                rows={ingredientRows(sel, g.items, g.seasonings)}
                missCount={calcMiss(sel, g.items, g.seasonings)}
                isFav={g.isFav(sel)}
                onToggleFav={onToggleFav}
                onCook={onCook}
                onClose={() => setSel(null)}
              />
            )}
          </div>
        </div>
      </div>
    </PixelScreen>
  );
}
