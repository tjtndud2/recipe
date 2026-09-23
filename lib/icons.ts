import { DISH, ICONS } from "./constants";
import type { Recipe } from "./types";

/** 긴 키가 먼저 매칭되도록 정렬 (원본 ICONS_BY_LEN) */
const ICONS_BY_LEN = [...ICONS].sort((a, b) => b[0].length - a[0].length);

const ico = (key: string) => `/assets/px/${key}.png`;

/** 재료 이름 → 픽셀 아이콘 경로. 못 찾으면 샐러드(b62) 로 폴백. */
export function iconFor(name: string): string {
  const hit = ICONS_BY_LEN.find(([k]) => name.includes(k));
  return ico(hit ? hit[1] : "b62");
}

/** 완성 요리 아이콘 경로. recipe.icon 우선, 없으면 요리명으로 추론. */
export function dishIcon(recipe: Pick<Recipe, "icon" | "name">): string {
  const key = recipe.icon ? DISH[recipe.icon] : undefined;
  return key ? ico(key) : iconFor(recipe.name || "");
}

/** CSS background 단축 표기 (원본과 동일) */
export function iconBg(src: string): string {
  return `url(${src}) center/contain no-repeat`;
}
