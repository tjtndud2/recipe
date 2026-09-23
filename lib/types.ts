/** 냉장고 재료 한 칸. 필드명은 원본 pixelFridge.v1 세이브와 호환된다. */
export type FridgeItem = {
  id: string;
  name: string;
  qty: number;
  /** 유통기한 (epoch ms) */
  exp: number;
};

export type RecipeUse = {
  name: string;
  amount: number;
};

export type Recipe = {
  name: string;
  /** DISH 키 (soup | rice | egg | noodle | ...) */
  icon?: string;
  minutes: number;
  difficulty: string;
  uses: RecipeUse[];
  missing: string[];
  steps: string[];
};

export type Plant = {
  growth: number;
  /** 마지막으로 물 준 시각 (epoch ms) */
  last: number;
};

/** 레시피 추천 요청. 나중에 POST /api/recipe 의 body 가 된다. */
export type RecipeRequest = {
  items: { name: string; qty: number; daysLeft: number }[];
  /** 보유 중인 양념 이름 목록 */
  seasonings: string[];
  /** '전체' | '15분' | '30분' | '60분' */
  time: string;
  /** '전체' | '쉬움' | '보통' */
  diff: string;
  minMissing: boolean;
};

/** 레시피 카드/상세에 그릴 재료 한 줄 */
export type UseRow = {
  name: string;
  amount: number;
  ok: boolean;
  missing: boolean;
  icon: string;
  bg: string;
  op: number;
  mark: string;
  chipBg: string;
  amountText: string;
};

export type SavedGame = {
  items: FridgeItem[];
  favs: Recipe[];
  nick: string;
  shirt: string;
  cooked: number;
};
