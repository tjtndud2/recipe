import { DAY } from "./constants";
import { iconFor } from "./icons";
import type { FridgeItem, Recipe, UseRow } from "./types";

/** 남은 일수. 원본 dLeft() 와 동일 (올림). */
export function dLeft(item: FridgeItem): number {
  return Math.ceil((item.exp - Date.now()) / DAY);
}

/** D-day 배지 색 (원본 dc()) */
export function dColor(d: number): string {
  return d <= 1 ? "#d8433b" : d <= 3 ? "#f0a020" : "#5aa83c";
}

/** D-day 배지 문구 */
export function dLabel(d: number): string {
  return d < 0 ? "지남" : d === 0 ? "D-day" : "D-" + d;
}

/**
 * 원본 has(): 냉장고 재료와 양방향 부분 일치하거나, 보유 양념이면 있다고 본다.
 */
export function hasIngredient(
  items: FridgeItem[],
  seasonings: Record<string, boolean>,
  name: string
): boolean {
  const hit = items.some(
    (i) => i.name === name || i.name.includes(name) || name.includes(i.name)
  );
  return hit || !!seasonings[name];
}

/** 레시피 카드/상세에 그릴 재료 줄 (원본 useRows()).
 *  훅이 아니므로 use- 접두사를 피해 ingredientRows 로 둔다. */
export function ingredientRows(
  recipe: Recipe,
  items: FridgeItem[],
  seasonings: Record<string, boolean>
): UseRow[] {
  const have = (recipe.uses || []).map((u) => ({
    name: u.name,
    amount: u.amount || 1,
    ok: hasIngredient(items, seasonings, u.name),
    missing: false,
  }));
  const miss = (recipe.missing || []).map((n) => ({
    name: n,
    amount: 0,
    ok: false,
    missing: true,
  }));
  return [...have, ...miss].map((u) => ({
    ...u,
    icon: iconFor(u.name),
    bg: u.ok ? "#b9794a" : "#9c5f36",
    op: u.ok ? 1 : 0.55,
    mark: u.ok ? "✓" : "✕",
    chipBg: u.ok ? "#fff1d6" : "#f3b3ad",
    amountText: u.missing ? "(없음)" : `×${u.amount}`,
  }));
}

/** 부족한 재료 수 */
export function missCount(
  recipe: Recipe,
  items: FridgeItem[],
  seasonings: Record<string, boolean>
): number {
  return ingredientRows(recipe, items, seasonings).filter((u) => !u.ok).length;
}
