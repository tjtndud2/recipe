"use client";

// 원본 세 .dc.html 이 각자 들고 있던 DCLogic 클래스 상태를 하나로 합친 컨텍스트.
// localStorage 접근은 전부 useEffect 안에서만 일어나므로 SSR 중에는 실행되지 않는다.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DAY,
  ENERGY_KEY,
  KEY,
  PLANT_KEY,
  S_DEFAULT,
  S_KEY,
  SEASONINGS,
  SEED,
  SHIRTS,
  SMELL_KEY,
} from "./constants";
import {
  readFlag,
  readJSON,
  readNumber,
  writeFlag,
  writeJSON,
  writeNumber,
} from "./storage";
import type { FridgeItem, Plant, Recipe, SavedGame } from "./types";
import Toast from "@/components/Toast";

type GameState = {
  hydrated: boolean;
  /** 캐릭터가 확정되어 있는지 (온보딩의 '이어하기' / '캐릭터 다시 만들기' 조건) */
  hadSave: boolean;
  items: FridgeItem[];
  favs: Recipe[];
  nick: string;
  shirt: string;
  cooked: number;
  seasonings: Record<string, boolean>;
  plant: Plant;
  energy: number;
  smelly: boolean;

  setNick: (v: string) => void;
  setShirt: (v: string) => void;
  /** 닉네임을 정리해 저장하고 캐릭터 생성을 확정한다 */
  commitCharacter: (nick: string, shirt: string) => void;

  addItem: (name: string, qty: number, days: number) => void;
  incItem: (id: string) => void;
  decItem: (id: string) => void;
  removeItem: (id: string) => void;
  /** 레시피 재료를 차감하고 요리 횟수를 올린다. 차감된 재료 종류 수를 돌려준다. */
  cook: (recipe: Recipe) => number;

  isFav: (recipe: Recipe) => boolean;
  /** 추가했으면 true, 해제했으면 false */
  toggleFav: (recipe: Recipe) => boolean;

  toggleSeasoning: (name: string) => void;
  setAllSeasonings: (on: boolean) => void;

  setPlant: (p: Plant) => void;
  setEnergy: (v: number) => void;
  setSmelly: (v: boolean) => void;

  showToast: (msg: string) => void;
};

const GameContext = createContext<GameState | null>(null);

function seedItems(): FridgeItem[] {
  const now = Date.now();
  return SEED.map(([name, qty, d], i) => ({
    id: "i" + i,
    name,
    qty,
    exp: now + d * DAY,
  }));
}

// "지금 브라우저인가" 판정. 서버 스냅샷은 false, 클라이언트 스냅샷은 true 라서
// 하이드레이션 첫 렌더는 서버와 같은 껍데기를 그리고 그 직후 true 로 바뀐다.
const noopSubscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function GameProvider({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    clientSnapshot,
    serverSnapshot
  );

  // localStorage 는 lazy initializer 안에서 한 번만 읽는다.
  // 서버에서는 storage 래퍼가 전부 기본값을 돌려주므로 SSR 에서도 안전하다.
  const [saved] = useState(() => readJSON<Partial<SavedGame> | null>(KEY, null));

  const [hadSave, setHadSave] = useState(() => !!saved?.nick);
  // 빈 냉장고([])도 정상 저장 상태이므로, items 필드 자체가 없을 때만 시드를 채운다.
  const [items, setItems] = useState<FridgeItem[]>(() =>
    Array.isArray(saved?.items) ? saved.items : seedItems()
  );
  const [favs, setFavs] = useState<Recipe[]>(() =>
    Array.isArray(saved?.favs) ? saved.favs : []
  );
  const [nick, setNick] = useState(() => saved?.nick || "자취생");
  const [shirt, setShirt] = useState(() => saved?.shirt || SHIRTS[0]);
  const [cooked, setCooked] = useState(() => saved?.cooked ?? 0);
  const [seasonings, setSeasonings] = useState<Record<string, boolean>>(() =>
    readJSON<Record<string, boolean>>(S_KEY, S_DEFAULT)
  );
  const [plant, setPlantState] = useState<Plant>(() =>
    readJSON<Plant>(PLANT_KEY, { growth: 0, last: 0 })
  );
  const [energy, setEnergyState] = useState(() => readNumber(ENERGY_KEY, 60));
  const [smelly, setSmelly] = useState(() => readFlag(SMELL_KEY));
  const [toast, setToast] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedEnergy = useRef(Math.floor(energy));

  // pixelFridge.v1 저장 (원본 componentDidUpdate 와 동일한 묶음).
  // 캐릭터를 확정하기 전(hadSave === false)에는 nick 을 빈 문자열로 기록한다.
  // 기본값 "자취생" 을 미리 써 버리면 새로고침 시 '이어하기'로 잘못 판정된다.
  useEffect(() => {
    if (!hydrated) return;
    writeJSON(KEY, {
      items,
      favs,
      nick: hadSave ? nick.trim() || "자취생" : "",
      shirt,
      cooked,
    });
  }, [hydrated, hadSave, items, favs, nick, shirt, cooked]);

  useEffect(() => {
    if (!hydrated) return;
    writeJSON(S_KEY, seasonings);
  }, [hydrated, seasonings]);

  useEffect(() => {
    if (!hydrated) return;
    writeJSON(PLANT_KEY, plant);
  }, [hydrated, plant]);

  useEffect(() => {
    if (!hydrated) return;
    writeFlag(SMELL_KEY, smelly);
  }, [hydrated, smelly]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  // 닉네임을 비워 기본값으로 확정한 경우에도 hadSave 가 바뀌므로 저장 effect 가 돈다.
  const commitCharacter = useCallback((n: string, s: string) => {
    setNick(n.trim() || "자취생");
    setShirt(s);
    setHadSave(true);
  }, []);

  const addItem = useCallback(
    (name: string, qty: number, days: number) => {
      setItems((prev) => {
        const next = prev.map((i) => ({ ...i }));
        const ex = next.find((i) => i.name === name);
        if (ex) {
          ex.qty += qty;
          ex.exp = Date.now() + days * DAY;
        } else {
          next.push({
            id: "i" + Date.now(),
            name,
            qty,
            exp: Date.now() + days * DAY,
          });
        }
        return next;
      });
      showToast(`${name} ${qty}개를 넣었어요`);
    },
    [showToast]
  );

  const updateQty = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }, []);

  const incItem = useCallback((id: string) => updateQty(id, 1), [updateQty]);
  const decItem = useCallback((id: string) => updateQty(id, -1), [updateQty]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // 차감 결과와 차감된 재료 종류 수를 현재 items 로 먼저 계산한 뒤 상태를 갱신한다.
  // (state updater 안에서 외부 변수를 세면 실행 시점이 보장되지 않아 값이 틀어진다)
  const cook = useCallback(
    (recipe: Recipe) => {
      const next = items.map((i) => ({ ...i }));
      let count = 0;
      (recipe.uses || []).forEach((u) => {
        const it = next.find(
          (i) =>
            i.name === u.name ||
            i.name.includes(u.name) ||
            u.name.includes(i.name)
        );
        if (it) {
          it.qty -= u.amount || 1;
          count++;
        }
      });
      setItems(next.filter((i) => i.qty > 0));
      setCooked((c) => c + 1);
      setSmelly(true);
      return count;
    },
    [items]
  );

  const isFav = useCallback(
    (recipe: Recipe) => favs.some((f) => f.name === recipe.name),
    [favs]
  );

  const toggleFav = useCallback(
    (recipe: Recipe) => {
      const exists = favs.some((f) => f.name === recipe.name);
      setFavs(
        exists ? favs.filter((f) => f.name !== recipe.name) : [...favs, recipe]
      );
      return !exists;
    },
    [favs]
  );

  const toggleSeasoning = useCallback((name: string) => {
    setSeasonings((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const setAllSeasonings = useCallback((on: boolean) => {
    setSeasonings(
      on ? Object.fromEntries(SEASONINGS.map((n) => [n, true])) : {}
    );
  }, []);

  const setPlant = useCallback((p: Plant) => setPlantState(p), []);

  // 원본과 동일하게 정수 부분이 바뀔 때만 기록한다
  const setEnergy = useCallback((v: number) => {
    setEnergyState(v);
    const f = Math.floor(v);
    if (f !== savedEnergy.current) {
      savedEnergy.current = f;
      writeNumber(ENERGY_KEY, f);
    }
  }, []);

  const value = useMemo<GameState>(
    () => ({
      hydrated,
      hadSave,
      items,
      favs,
      nick,
      shirt,
      cooked,
      seasonings,
      plant,
      energy,
      smelly,
      setNick,
      setShirt,
      commitCharacter,
      addItem,
      incItem,
      decItem,
      removeItem,
      cook,
      isFav,
      toggleFav,
      toggleSeasoning,
      setAllSeasonings,
      setPlant,
      setEnergy,
      setSmelly,
      showToast,
    }),
    [
      hydrated,
      hadSave,
      items,
      favs,
      nick,
      shirt,
      cooked,
      seasonings,
      plant,
      energy,
      smelly,
      commitCharacter,
      addItem,
      incItem,
      decItem,
      removeItem,
      cook,
      isFav,
      toggleFav,
      toggleSeasoning,
      setAllSeasonings,
      setPlant,
      setEnergy,
      showToast,
    ]
  );

  return (
    <GameContext.Provider value={value}>
      {children}
      <Toast message={toast} />
    </GameContext.Provider>
  );
}

export function useGame(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
