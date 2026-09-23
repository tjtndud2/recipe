"use client";

// 거실 / 자취방 — 원본 거실.dc.html 의 isRoom 블록.
// 원본의 requestAnimationFrame 루프를 그대로 옮긴다.
// 좌표는 ref(s) 에 두고 매 프레임 갱신하되, 렌더가 읽는 값은 view 스냅샷 state 다.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import PixelScreen from "@/components/PixelScreen";
import PixelCharacter from "@/components/PixelCharacter";
import {
  clamp,
  FROM_FRIDGE_KEY,
  FX,
  FY,
  PLANT,
  PX,
  PY,
} from "@/lib/constants";
import { dLeft } from "@/lib/fridge";
import { useGame } from "@/lib/game-state";
import { setSessionFlag, takeSessionFlag } from "@/lib/storage";

const MOVE_KEYS = [
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "w",
  "a",
  "s",
  "d",
];

// 좌표만 받는 순수 판정 함수 — 렌더에서는 view, 콜백에서는 ref 값을 넘긴다.
const nearFridge = (cx: number, cy: number) =>
  Math.abs(cx - FX) < 9 && Math.abs(cy - FY) < 10;
const nearPlant = (cx: number, cy: number) =>
  Math.abs(cx - PX) < 7 && Math.abs(cy - PY) < 8;
const inBedAt = (cx: number, cy: number) => cx > 74 && cy >= 48 && cy <= 72;
const moistureOf = (last: number) =>
  Math.max(0, Math.round(100 - (Date.now() - (last || 0)) / 3000));

const tag: CSSProperties = {
  background: "#3b2418",
  color: "#fff1d6",
  padding: "2px 6px",
  fontSize: 11,
  fontWeight: 700,
};

type View = {
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  step: number;
  energy: number;
  moved: boolean;
};

const INITIAL: View = {
  cx: 50,
  cy: 80,
  tx: 50,
  ty: 80,
  step: 0,
  energy: 60,
  moved: false,
};

export default function Room() {
  const router = useRouter();
  const g = useGame();

  // 루프에서 항상 최신 컨텍스트를 보도록 ref 로 들고 있는다 (렌더 중이 아니라 effect 에서 갱신)
  const gRef = useRef(g);
  useEffect(() => {
    gRef.current = g;
  });

  const [view, setView] = useState<View>(INITIAL);
  const [windowOpen, setWindowOpen] = useState(false);
  const [windowMsg, setWindowMsg] = useState("");
  const [watering, setWatering] = useState(false);

  const s = useRef({
    ...INITIAL,
    pendingOpen: false,
    pendingWater: false,
  });
  const keys = useRef<Set<string>>(new Set());
  const rafId = useRef<number | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const energyFloor = useRef(60);
  const started = useRef(false);

  /** ref 의 현재 값을 렌더용 스냅샷으로 넘긴다 */
  const commit = useCallback(() => {
    const { cx, cy, tx, ty, step, energy, moved } = s.current;
    setView({ cx, cy, tx, ty, step, energy, moved });
  }, []);

  const say = useCallback((msg: string, ms = 2200) => {
    setWindowMsg(msg);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setWindowMsg(""), ms);
  }, []);

  const goFridge = useCallback(() => {
    setSessionFlag(FROM_FRIDGE_KEY);
    router.push("/fridge");
  }, [router]);

  const water = useCallback(() => {
    const gg = gRef.current;
    const { cx, cy } = s.current;
    if (!nearPlant(cx, cy)) {
      s.current.tx = PX;
      s.current.ty = PY;
      s.current.pendingWater = true;
      s.current.pendingOpen = false;
      commit();
      return;
    }
    if (moistureOf(gg.plant.last) > 70) {
      say("흙이 아직 촉촉해. 나중에 주자");
      return;
    }
    const before = Math.min(3, Math.floor(gg.plant.growth / 3));
    const next = { growth: gg.plant.growth + 1, last: Date.now() };
    const after = Math.min(3, Math.floor(next.growth / 3));
    gg.setPlant(next);
    setWatering(true);
    if (dropTimer.current) clearTimeout(dropTimer.current);
    dropTimer.current = setTimeout(() => setWatering(false), 1400);
    say(
      after > before
        ? after === 3
          ? "꽃이 활짝 폈다!"
          : `쑥! 식물이 자랐다 (Lv.${after + 1})`
        : "물 줬다! 쑥쑥 자라라"
    );
  }, [commit, say]);

  const openFridge = useCallback(() => {
    const { cx, cy } = s.current;
    if (nearFridge(cx, cy)) {
      goFridge();
    } else {
      s.current.tx = FX;
      s.current.ty = FY + 3;
      s.current.pendingOpen = true;
      commit();
    }
  }, [commit, goFridge]);

  // 하이드레이션 직후 1회: 에너지 복원 + 냉장고에서 돌아온 경우 위치 배치
  useEffect(() => {
    if (!g.hydrated || started.current) return;
    started.current = true;
    s.current.energy = gRef.current.energy;
    energyFloor.current = Math.floor(s.current.energy);
    if (takeSessionFlag(FROM_FRIDGE_KEY)) {
      s.current.cx = FX + 4;
      s.current.cy = FY + 6;
      s.current.tx = FX + 4;
      s.current.ty = FY + 6;
      s.current.moved = true;
    }
    commit();
  }, [g.hydrated, commit]);

  // 원본 componentDidMount: 키 입력 + rAF 루프 + 5초마다 습도 갱신
  useEffect(() => {
    if (!g.hydrated) return;

    const syncEnergy = () => {
      const f = Math.floor(s.current.energy);
      if (f !== energyFloor.current) {
        energyFloor.current = f;
        gRef.current.setEnergy(s.current.energy);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const t = (e.target as HTMLElement | null)?.tagName;
      if (t === "INPUT" || t === "TEXTAREA") return;
      const k = e.key.toLowerCase();
      if (MOVE_KEYS.includes(k)) {
        e.preventDefault();
        keys.current.add(k);
        if (s.current.pendingOpen || s.current.pendingWater) {
          s.current.pendingOpen = false;
          s.current.pendingWater = false;
        }
      }
      if (k === "e" || k === " " || k === "enter") {
        const { cx, cy } = s.current;
        if (nearFridge(cx, cy)) {
          e.preventDefault();
          openFridge();
        } else if (nearPlant(cx, cy)) {
          e.preventDefault();
          water();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) =>
      keys.current.delete(e.key.toLowerCase());
    const onBlur = () => keys.current.clear();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    const loop = () => {
      rafId.current = requestAnimationFrame(loop);
      const st = s.current;
      const k = keys.current;
      let dx = 0;
      let dy = 0;
      if (k.has("arrowleft") || k.has("a")) dx -= 1;
      if (k.has("arrowright") || k.has("d")) dx += 1;
      if (k.has("arrowup") || k.has("w")) dy -= 1;
      if (k.has("arrowdown") || k.has("s")) dy += 1;

      if (dx || dy) {
        st.cx = clamp(st.cx + dx * 0.45, 4, 96);
        st.cy = clamp(st.cy + dy * 0.6, 48, 97);
        st.tx = st.cx;
        st.ty = st.cy;
        st.step += 1;
        st.moved = true;
        st.energy = Math.max(0, st.energy - 0.02);
        syncEnergy();
        commit();
        return;
      }

      const ddx = st.tx - st.cx;
      const ddy = st.ty - st.cy;
      const d = Math.hypot(ddx, ddy);

      if (d <= 0.4 && inBedAt(st.cx, st.cy) && st.energy < 100) {
        st.energy = Math.min(100, st.energy + 0.25);
        st.step = 0;
        syncEnergy();
        commit();
        return;
      }

      if (d > 0.4) {
        const m = Math.min(0.55, d);
        st.cx += (ddx / d) * m;
        st.cy += (ddy / d) * m;
        st.step += 1;
        st.moved = true;
        st.energy = Math.max(0, st.energy - 0.02);
        syncEnergy();
        commit();
      } else if (st.pendingOpen) {
        st.pendingOpen = false;
        goFridge();
      } else if (st.pendingWater) {
        st.pendingWater = false;
        water();
      } else if (st.step) {
        st.step = 0;
        commit();
      }
    };
    loop();

    // 시간이 지나면 화분 습도가 마르므로 주기적으로 다시 그린다
    const moistTimer = setInterval(commit, 5000);
    const msg = msgTimer;
    const drop = dropTimer;

    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      clearInterval(moistTimer);
      if (msg.current) clearTimeout(msg.current);
      if (drop.current) clearTimeout(drop.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [g.hydrated, commit, goFridge, openFridge, water]);

  if (!g.hydrated) return <PixelScreen>{null}</PixelScreen>;

  // ── 렌더 값 (원본 renderVals) ──────────────────────────────────────────
  const walking = view.step > 0;
  const frame = walking ? Math.floor(view.step / 7) % 4 : 0;
  const isNear = nearFridge(view.cx, view.cy);
  const isNearPot = nearPlant(view.cx, view.cy);
  const idle = Math.hypot(view.tx - view.cx, view.ty - view.cy) <= 0.4;
  const sleeping = idle && inBedAt(view.cx, view.cy);
  const charging = sleeping && view.energy < 100;

  const e = Math.floor(view.energy);
  const batColor = e <= 20 ? "#d8433b" : e <= 50 ? "#f7b733" : "#6fbf4a";
  const batCells = Array.from({ length: 10 }, (_, i) =>
    i < Math.ceil(e / 10) ? batColor : "#6f3f22"
  );

  const exp = g.cooked * 30;
  const lv = Math.floor(exp / 100) + 1;
  const expIn = exp % 100;
  const urgentCount = g.items.filter((i) => dLeft(i) <= 3).length;

  const m = moistureOf(g.plant.last);
  const stage = Math.min(3, Math.floor(g.plant.growth / 3));
  const dry = m === 0;
  const plantPal: Record<string, string> = {
    G: dry ? "#9a8a3a" : "#5aa83c",
    D: dry ? "#7a6a2a" : "#3f8a2a",
    F: "#d8433b",
    Y: "#f7b733",
  };
  const plantCells = PLANT[stage]
    .join("")
    .split("")
    .map((ch) => plantPal[ch] || "transparent");
  const moistCells = Array.from({ length: 5 }, (_, i) =>
    i < Math.ceil(m / 20) ? "#6f9fd8" : "#6f3f22"
  );

  const showPrompt =
    g.smelly || sleeping || isNear || isNearPot || !view.moved || !!windowMsg;
  const promptText =
    windowMsg ||
    (g.smelly
      ? "킁킁… 냄새가 나네? 창문을 열어볼까?"
      : sleeping
        ? charging
          ? `Z z z… 충전 중 ${e}%`
          : "에너지 가득! 개운하다"
        : !isNear && isNearPot
          ? m > 70
            ? "촉촉한 흙… 잘 자라는 중"
            : "E  물 주기"
          : isNear
            ? "E  냉장고 열기"
            : "배고프다… 냉장고를 눌러볼까?");

  const charTransform = sleeping
    ? "rotate(-90deg) translate(-30%, 0)"
    : `translateY(${walking && frame % 2 ? "-3%" : "0"})`;
  const charZ = sleeping
    ? 80
    : g.smelly || isNear || isNearPot || !view.moved || windowMsg
      ? 90
      : Math.round(view.cy);

  const onRoomClick = (ev: MouseEvent<HTMLDivElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    s.current.tx = clamp(((ev.clientX - r.left) / r.width) * 100, 4, 96);
    s.current.ty = clamp(((ev.clientY - r.top) / r.height) * 100, 48, 97);
    s.current.pendingOpen = false;
    s.current.pendingWater = false;
    commit();
  };

  const onWindowClick = (ev: MouseEvent<HTMLDivElement>) => {
    ev.stopPropagation();
    const open = !windowOpen;
    const aired = open && g.smelly;
    if (aired) g.setSmelly(false);
    setWindowOpen(open);
    say(
      aired
        ? "환기 완료! 냄새가 싹 빠졌다"
        : open
          ? "바람 시원하다~"
          : "창문 닫았다"
    );
  };

  const onBedClick = (ev: MouseEvent<HTMLDivElement>) => {
    ev.stopPropagation();
    s.current.tx = 86;
    s.current.ty = 62;
    s.current.pendingOpen = false;
    commit();
  };

  return (
    <PixelScreen>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "stretch",
            width: 1143,
            height: 97,
          }}
        >
          <div
            style={{
              flex: "0 1 50%",
              minWidth: 280,
              boxSizing: "border-box",
              display: "flex",
              gap: 12,
              alignItems: "center",
              background: "#b9794a",
              border: "4px solid #3b2418",
              boxShadow:
                "inset -4px -4px 0 #8d5330, inset 4px 4px 0 #d9a36f, 4px 4px 0 rgba(40,20,10,.35)",
              padding: "10px 14px",
              width: 709,
              height: 95,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                flexShrink: 0,
                background: "#cfd8e0",
                border: "4px solid #3b2418",
                boxShadow: "inset -3px -3px 0 #9aa7b4",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <div style={{ marginTop: 4 }}>
                <PixelCharacter shirt={g.shirt} width={40} cellLimit={100} />
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "baseline",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#fff1d6",
                    textShadow: "2px 2px 0 #3b2418",
                  }}
                >
                  {g.nick}
                </span>
                <span
                  style={{
                    background: "#f7b733",
                    border: "2px solid #3b2418",
                    padding: "0 6px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Lv.{lv} 자취생
                </span>
              </div>

              <div
                style={{
                  height: 14,
                  background: "#3b2418",
                  border: "2px solid #3b2418",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: `${expIn}%`,
                    background: "#6fbf4a",
                    boxShadow: "inset 0 3px 0 #a5e27f",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "2px 8px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#3b2418",
                    whiteSpace: "nowrap",
                  }}
                >
                  EXP {expIn}/100 · 요리 {g.cooked}회
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 2,
                        padding: 2,
                        background: "#3b2418",
                        border: "2px solid #3b2418",
                      }}
                    >
                      {batCells.map((b, i) => (
                        <div
                          key={i}
                          style={{ width: 7, height: 10, background: b }}
                        />
                      ))}
                    </div>
                    <div
                      style={{ width: 4, height: 8, background: "#3b2418" }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#3b2418",
                      whiteSpace: "nowrap",
                    }}
                  >
                    에너지 {e}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 방 */}
        <div
          onClick={onRoomClick}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/10",
            minHeight: 300,
            overflow: "hidden",
            border: "4px solid #3b2418",
            boxShadow: "inset 0 0 0 4px #8d5330, 4px 4px 0 rgba(40,20,10,.35)",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {/* 벽 / 바닥 */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: "40%",
              background:
                "repeating-linear-gradient(90deg,#ecdcb8 0 24px,#e2cea4 24px 48px)",
              borderBottom: "8px solid #8d5330",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "40%",
              bottom: 0,
              background:
                "repeating-linear-gradient(0deg,#c98e5a 0 26px,#b9794a 26px 30px)",
            }}
          />

          {/* 창문 */}
          <div
            className="window-obj"
            onClick={onWindowClick}
            style={{
              position: "absolute",
              left: "40%",
              top: "7%",
              width: "18%",
              height: "22%",
              background: "#8fd0f0",
              border: "5px solid #8d5330",
              boxShadow: "inset 0 -12px 0 #b7e3f7",
              overflow: "visible",
              cursor: "pointer",
              zIndex: 4,
            }}
          >
            <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  right: "14%",
                  top: "14%",
                  width: "16%",
                  aspectRatio: "1/1",
                  background: "#f7b733",
                  border: "3px solid #c47d12",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: windowOpen ? "70%" : "-10%",
                  top: "30%",
                  width: "34%",
                  height: "16%",
                  background: "#ffffff",
                  boxShadow: "6px -6px 0 0 #ffffff",
                  transition: "left 6s linear",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: windowOpen ? "14%" : "50%",
                background: "rgba(255,255,255,.28)",
                borderRight: "4px solid #8d5330",
                boxShadow: "inset 4px 4px 0 rgba(255,255,255,.5)",
                transition: "width .45s steps(5)",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: windowOpen ? "14%" : "50%",
                background: "rgba(255,255,255,.28)",
                borderLeft: "4px solid #8d5330",
                boxShadow: "inset 4px 4px 0 rgba(255,255,255,.5)",
                transition: "width .45s steps(5)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "calc(100% + 8px)",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                background: "#3b2418",
                color: "#fff1d6",
                padding: "1px 6px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {windowOpen ? "창문 닫기" : "창문 열기"}
            </div>
          </div>

          {/* 책상 위 모니터 */}
          <div
            style={{
              position: "absolute",
              left: "36%",
              top: "62%",
              width: "28%",
              height: "20%",
              background: "#cfd8e0",
              border: "4px solid #3b2418",
              boxShadow: "inset 0 0 0 5px #9aa7b4",
            }}
          />

          {/* 침대 */}
          <div
            className="brighten-06"
            onClick={onBedClick}
            style={{
              position: "absolute",
              right: "3%",
              top: "30%",
              width: "24%",
              height: "40%",
              zIndex: 70,
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: -30,
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                display: "flex",
                gap: 4,
              }}
            >
              <span style={tag}>침대</span>
              {charging && (
                <span
                  className="blink-10"
                  style={{
                    background: "#6fbf4a",
                    color: "#fff",
                    border: "2px solid #3b2418",
                    padding: "0 5px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  충전 중
                </span>
              )}
            </div>
            <div
              style={{
                height: "22%",
                background: "#8d5330",
                border: "4px solid #3b2418",
                boxShadow: "inset 3px 3px 0 #b9794a",
              }}
            />
            <div
              style={{
                flex: 1,
                background: "#fff1d6",
                border: "4px solid #3b2418",
                borderTop: "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  height: "26%",
                  margin: "6% 12% 0",
                  background: "#eef2f5",
                  border: "3px solid #3b2418",
                }}
              />
              <div
                style={{
                  flex: 1,
                  marginTop: "8%",
                  background: "#6f9fd8",
                  borderTop: "4px solid #3b2418",
                  boxShadow: "inset 0 5px 0 #9dc0ea",
                }}
              />
            </div>
          </div>

          {/* 화분 */}
          <div
            className="brighten-10"
            onClick={(ev) => {
              ev.stopPropagation();
              water();
            }}
            style={{
              position: "absolute",
              left: "63%",
              top: "22%",
              width: "6%",
              minWidth: 34,
              height: "26%",
              zIndex: 48,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "calc(100% + 6px)",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              <span style={tag}>화분 Lv.{stage + 1}</span>
              <div
                style={{
                  display: "flex",
                  gap: 1,
                  padding: 2,
                  background: "#3b2418",
                }}
              >
                {moistCells.map((c, i) => (
                  <div key={i} style={{ width: 5, height: 9, background: c }} />
                ))}
              </div>
            </div>

            {watering && (
              <div
                className="blink-035"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: "30%",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "18%",
                    top: "10%",
                    width: 6,
                    height: 8,
                    background: "#6f9fd8",
                    border: "1px solid #3f5a8a",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "48%",
                    top: "40%",
                    width: 6,
                    height: 8,
                    background: "#6f9fd8",
                    border: "1px solid #3f5a8a",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "74%",
                    top: 0,
                    width: 6,
                    height: 8,
                    background: "#6f9fd8",
                    border: "1px solid #3f5a8a",
                  }}
                />
              </div>
            )}

            <div
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "repeat(8,1fr)",
              }}
            >
              {plantCells.map((c, i) => (
                <div key={i} style={{ aspectRatio: "1/1", background: c }} />
              ))}
            </div>
            <div
              style={{
                width: "110%",
                height: "12%",
                boxSizing: "border-box",
                background: "#c46a3a",
                border: "3px solid #3b2418",
                boxShadow: "inset 0 -3px 0 #9a4a24",
              }}
            />
            <div
              style={{
                width: "84%",
                height: "24%",
                boxSizing: "border-box",
                background: "#b85a30",
                border: "3px solid #3b2418",
                borderTop: "none",
                boxShadow: "inset -4px 0 0 #8a3e1e",
              }}
            />
          </div>

          {/* 냉장고 */}
          <div
            className="brighten-06"
            onClick={(ev) => {
              ev.stopPropagation();
              openFridge();
            }}
            style={{
              position: "absolute",
              left: "7%",
              top: "12%",
              width: "13%",
              height: "52%",
              zIndex: 62,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              background: "#eef2f5",
              border: `4px solid ${isNear ? "#f7b733" : "#3b2418"}`,
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
                  width: "8%",
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
                padding: "10% 8%",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: "12%",
                  top: "10%",
                  width: "8%",
                  height: "26%",
                  background: "#3b2418",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: -34,
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                display: "flex",
                gap: 4,
              }}
            >
              <span style={tag}>냉장고</span>
              {urgentCount > 0 && (
                <span
                  className="blink-12"
                  style={{
                    background: "#d8433b",
                    color: "#fff",
                    border: "2px solid #3b2418",
                    padding: "0 5px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  ! {urgentCount}
                </span>
              )}
            </div>
          </div>

          {/* 캐릭터 */}
          <div
            style={{
              position: "absolute",
              left: `${view.cx}%`,
              top: `${view.cy}%`,
              width: "6.5%",
              minWidth: 40,
              transform: "translate(-50%,-100%)",
              zIndex: charZ,
              pointerEvents: "none",
            }}
          >
            {showPrompt && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "calc(100% + 26px)",
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  background: "#fff1d6",
                  border: "3px solid #3b2418",
                  padding: "3px 8px",
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: "3px 3px 0 rgba(40,20,10,.35)",
                }}
              >
                {promptText}
              </div>
            )}
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: "calc(100% + 4px)",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                background: "rgba(59,36,24,.85)",
                color: "#fff1d6",
                padding: "1px 6px",
                fontSize: 11,
              }}
            >
              {g.nick}
            </div>
            <div style={{ transform: charTransform }}>
              <PixelCharacter shirt={g.shirt} frame={frame} width={74} />
            </div>
            <div
              style={{
                position: "absolute",
                left: "10%",
                right: "10%",
                bottom: -4,
                height: 8,
                background: "rgba(40,20,10,.3)",
                zIndex: -1,
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 16px",
            justifyContent: "center",
            fontSize: 12,
            color: "#fff1d6",
            textShadow: "1px 1px 0 #3b2418",
          }}
        >
          <span>방향키 / WASD 이동</span>
          <span>바닥 클릭 → 그 자리로 이동</span>
          <span>냉장고 클릭 또는 E → 열기</span>
        </div>
      </div>
    </PixelScreen>
  );
}
