"use client";

// 온보딩 — 원본 온보딩.dc.html 의 isSplash 블록 (타이틀 / 캐릭터 만들기).

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import PixelScreen from "@/components/PixelScreen";
import PixelCharacter from "@/components/PixelCharacter";
import { SHIRTS } from "@/lib/constants";
import { useGame } from "@/lib/game-state";

const STEPS = [
  {
    no: "STEP 1",
    title: "🧺 재료 넣기",
    desc: "냉장고에 재료와 유통기한을 기록해요",
  },
  {
    no: "STEP 2",
    title: "✨ AI 추천",
    desc: "임박 재료부터 쓰는 레시피를 받아요",
  },
  {
    no: "STEP 3",
    title: "🍳 요리 · 레벨업",
    desc: "요리하면 재료가 빠지고 EXP를 얻어요",
  },
];

const panel: CSSProperties = {
  background: "#b9794a",
  border: "4px solid #3b2418",
  boxShadow:
    "inset -4px -4px 0 #8d5330, inset 4px 4px 0 #d9a36f, 4px 4px 0 rgba(40,20,10,.35)",
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const label: CSSProperties = {
  fontWeight: 700,
  color: "#fff1d6",
  textShadow: "2px 2px 0 #3b2418",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { hydrated, hadSave, nick, shirt, setNick, setShirt, commitCharacter } =
    useGame();

  const [step, setStep] = useState<"title" | "create">("title");

  const startGame = () => {
    if (hadSave) router.push("/room");
    else setStep("create");
  };

  const enterRoom = () => {
    commitCharacter(nick, shirt);
    router.push("/room");
  };

  // 원본 componentDidMount 의 splash 분기: 타이틀에서 Enter → 시작
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = (e.target as HTMLElement | null)?.tagName;
      if (t === "INPUT" || t === "TEXTAREA") return;
      if (e.key.toLowerCase() === "enter" && step === "title") startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, hadSave]);

  if (!hydrated) return <PixelScreen>{null}</PixelScreen>;

  return (
    <PixelScreen>
      <div
        style={{
          minHeight: "calc(100vh - 88px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {step === "title" ? (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 28,
              textAlign: "center",
              padding: "24px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  background: "#3b2418",
                  color: "#f7b733",
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 2,
                  whiteSpace: "nowrap",
                }}
              >
                AI RECIPE QUEST
              </div>
              <div
                style={{
                  fontSize: 76,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                  color: "#fff1d6",
                  textShadow:
                    "4px 4px 0 #3b2418, -2px -2px 0 #3b2418, 2px -2px 0 #3b2418, -2px 2px 0 #3b2418, 8px 8px 0 #8d5330",
                }}
              >
                냉장고 RPG
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#3b2418",
                  background: "#fff1d6",
                  border: "3px solid #3b2418",
                  padding: "4px 12px",
                  boxShadow: "3px 3px 0 rgba(40,20,10,.35)",
                }}
              >
                자취생의 오늘 한 끼 퀘스트
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
              <div style={{ filter: "drop-shadow(4px 4px 0 rgba(40,20,10,.35))" }}>
                <PixelCharacter shirt={shirt} width={96} />
              </div>
              <div
                style={{
                  width: 84,
                  height: 160,
                  display: "flex",
                  flexDirection: "column",
                  background: "#eef2f5",
                  border: "4px solid #3b2418",
                  boxShadow:
                    "inset -6px -6px 0 #b8c3ce, inset 4px 4px 0 #ffffff, 4px 4px 0 rgba(40,20,10,.35)",
                }}
              >
                <div
                  style={{
                    height: "36%",
                    borderBottom: "4px solid #3b2418",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: "12%",
                      bottom: "12%",
                      width: 6,
                      height: "40%",
                      background: "#3b2418",
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    display: "flex",
                    flexWrap: "wrap",
                    alignContent: "flex-start",
                    gap: 2,
                    padding: "10px 8px",
                    fontSize: 16,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: "12%",
                      top: "10%",
                      width: 6,
                      height: "26%",
                      background: "#3b2418",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                width: 320,
              }}
            >
              <button
                className="btn-yellow"
                onClick={startGame}
                style={{
                  width: "100%",
                  cursor: "pointer",
                  padding: "14px 16px",
                  background: "#f7b733",
                  border: "4px solid #3b2418",
                  boxShadow:
                    "inset -4px -4px 0 #c47d12, inset 4px 4px 0 #ffe08a, 4px 4px 0 rgba(40,20,10,.35)",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#3b2418",
                  borderRadius: 0,
                }}
              >
                ▶ {hadSave ? "이어하기" : "시작하기"}
              </button>

              {hadSave && (
                <button
                  className="btn-cream"
                  onClick={() => setStep("create")}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    padding: "10px 16px",
                    background: "#fff1d6",
                    border: "4px solid #3b2418",
                    boxShadow: "inset -4px -4px 0 #d9c2a0",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#3b2418",
                    borderRadius: 0,
                  }}
                >
                  캐릭터 다시 만들기
                </button>
              )}

              <div
                className="blink-14"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff1d6",
                  textShadow: "2px 2px 0 #3b2418",
                  whiteSpace: "nowrap",
                }}
              >
                PRESS ENTER
              </div>
            </div>
          </div>
        ) : (
          <div style={{ width: 640, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex" }}>
              <div
                style={{
                  background: "#b9794a",
                  border: "4px solid #3b2418",
                  borderBottom: "none",
                  boxShadow: "inset 4px 4px 0 #d9a36f",
                  padding: "6px 16px 4px",
                  fontWeight: 700,
                  color: "#fff1d6",
                  textShadow: "2px 2px 0 #3b2418",
                  fontSize: 16,
                }}
              >
                캐릭터 만들기
              </div>
            </div>

            <div style={panel}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div
                  style={{
                    width: 120,
                    height: 140,
                    flexShrink: 0,
                    background: "#cfd8e0",
                    border: "4px solid #3b2418",
                    boxShadow:
                      "inset -4px -4px 0 #9aa7b4, inset 4px 4px 0 #eef2f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PixelCharacter shirt={shirt} width={72} />
                </div>

                <div
                  style={{
                    flex: "1 1 220px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <span style={label}>이름</span>
                    <input
                      value={nick}
                      onChange={(e) => setNick(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") enterRoom();
                      }}
                      maxLength={8}
                      placeholder="최대 8자"
                      style={{
                        fontFamily: "inherit",
                        fontSize: 15,
                        padding: 10,
                        background: "#fff1d6",
                        border: "4px solid #3b2418",
                        boxShadow: "inset 3px 3px 0 #d9c2a0",
                        color: "#3b2418",
                        borderRadius: 0,
                      }}
                    />
                  </div>

                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <span style={label}>옷 색</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      {SHIRTS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setShirt(c)}
                          aria-label={`옷 색 ${c}`}
                          style={{
                            width: 36,
                            height: 36,
                            cursor: "pointer",
                            background: c,
                            border: `4px solid ${
                              c === shirt ? "#fff1d6" : "#3b2418"
                            }`,
                            boxShadow: "inset -3px -3px 0 rgba(0,0,0,.25)",
                            borderRadius: 0,
                            padding: 0,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 8,
                }}
              >
                {STEPS.map((s) => (
                  <div
                    key={s.no}
                    style={{
                      background: "#9c5f36",
                      border: "4px solid #3b2418",
                      boxShadow: "inset 3px 3px 0 #6f3f22",
                      padding: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      color: "#fff1d6",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: "#3b2418",
                        color: "#f7b733",
                        padding: "1px 6px",
                        alignSelf: "flex-start",
                      }}
                    >
                      {s.no}
                    </span>
                    <span
                      style={{ fontWeight: 700, textShadow: "1px 1px 0 #3b2418" }}
                    >
                      {s.title}
                    </span>
                    <span style={{ fontSize: 12, color: "#3b2418" }}>
                      {s.desc}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="press"
                  onClick={() => setStep("title")}
                  style={{
                    cursor: "pointer",
                    padding: "12px 16px",
                    background: "#fff1d6",
                    border: "4px solid #3b2418",
                    boxShadow: "inset -4px -4px 0 #d9c2a0",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#3b2418",
                    borderRadius: 0,
                  }}
                >
                  ◀
                </button>
                <button
                  className="btn-yellow"
                  onClick={enterRoom}
                  style={{
                    flex: 1,
                    cursor: "pointer",
                    padding: "12px 16px",
                    background: "#f7b733",
                    border: "4px solid #3b2418",
                    boxShadow:
                      "inset -4px -4px 0 #c47d12, inset 4px 4px 0 #ffe08a",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#3b2418",
                    borderRadius: 0,
                  }}
                >
                  모험 시작 ▶
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PixelScreen>
  );
}
