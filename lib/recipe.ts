import { getMockRecipes } from "./mock-recipes";
import type { Recipe, RecipeRequest } from "./types";

/** 서버(8초)보다 넉넉한 클라이언트 쪽 상한 — 요청이 매달려 있지 않도록 */
const CLIENT_TIMEOUT_MS = 15000;

/**
 * 레시피 추천 진입점. UI(냉장고 화면)는 오직 이 함수만 호출한다.
 *
 * POST /api/recipe → (서버) Google Gemini → Recipe[]
 * API 키는 Route Handler 안에서만 읽으므로 이 파일에는 키도 SDK 도 없다.
 *
 * 네트워크 오류·비정상 응답 등 무슨 일이 생겨도 mock 레시피로 떨어져
 * 추천 버튼이 사용자에게 실패로 보이지 않게 한다.
 */
export async function requestRecipes(req: RecipeRequest): Promise<Recipe[]> {
  try {
    const res = await fetch("/api/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`/api/recipe 응답 ${res.status}`);

    const data: unknown = await res.json();
    const recipes = (data as { recipes?: unknown })?.recipes;
    if (!Array.isArray(recipes) || recipes.length === 0) {
      throw new Error("레시피 배열이 비어 있습니다.");
    }
    return recipes.slice(0, 3) as Recipe[];
  } catch (err) {
    console.error(
      "[recipe] 추천 요청 실패 — mock 으로 대체합니다:",
      err instanceof Error ? err.message : err
    );
    return getMockRecipes(req);
  }
}
