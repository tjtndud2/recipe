// 레시피 추천 API — Google Gemini 호출은 이 파일(서버) 안에서만 일어난다.
// GEMINI_API_KEY 는 여기서만 읽으며, 클라이언트 번들에는 키도 SDK 도 들어가지 않는다.
// 어떤 단계에서 실패하든 항상 200 + mock 레시피로 응답한다 (사용자에게 에러 화면을 보이지 않는다).

import { NextResponse } from "next/server";
import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { DISH } from "@/lib/constants";
import { getMockRecipes } from "@/lib/mock-recipes";
import type { Recipe, RecipeRequest, RecipeUse } from "@/lib/types";

export const runtime = "nodejs";

const TIMEOUT_MS = 8000;
const MAX_RECIPES = 3;
const DIFFICULTIES = ["쉬움", "보통", "어려움"];
const ICON_KEYS = Object.keys(DISH);

const SYSTEM_INSTRUCTION = `당신은 자취생을 위한 요리 도우미입니다. 냉장고에 있는 재료로 오늘 한 끼를 해결하도록 돕습니다.

규칙:
- 사용자가 준 냉장고 재료와 보유 양념으로 만들 수 있는 1인분 요리 3개를 추천합니다.
- 유통기한이 임박한(D-n 이 작은) 재료를 우선 사용합니다.
- 보유 양념 목록에 있는 것만 있다고 가정합니다. 물은 항상 있다고 가정합니다.
- '없는 재료 최소화'가 켜져 있으면 냉장고와 보유 양념 모두에 없는 재료는 최대 1개까지만 씁니다.
- 조리시간 조건이 '전체'가 아니면 minutes 가 그 시간 이내여야 합니다.
- 난이도 조건이 '전체'가 아니면 difficulty 가 그 난이도여야 합니다.
- uses 의 name 은 사용자가 준 냉장고 재료명 또는 보유 양념명을 그대로 씁니다.
- missing 에는 냉장고와 보유 양념 모두에 없는 재료명만 넣습니다.
- uses 의 amount 는 1 이상의 정수입니다. steps 는 3~5개이며 "중불에서 3분"처럼 구체적으로 씁니다.
- 육류와 계란은 속까지 완전히 익히라고 안내합니다. 전자레인지에 금속 용기나 껍질째 계란을 넣는 등 위험한 방법은 절대 안내하지 않습니다.`;

/** Gemini structured output 스키마 — icon·difficulty 는 스키마 단계에서 값을 제한한다 */
const RECIPE_SCHEMA: Schema = {
  type: Type.ARRAY,
  minItems: String(MAX_RECIPES),
  maxItems: String(MAX_RECIPES),
  items: {
    type: Type.OBJECT,
    required: ["name", "icon", "minutes", "difficulty", "uses", "missing", "steps"],
    propertyOrdering: [
      "name",
      "icon",
      "minutes",
      "difficulty",
      "uses",
      "missing",
      "steps",
    ],
    properties: {
      name: { type: Type.STRING },
      icon: { type: Type.STRING, enum: ICON_KEYS },
      minutes: { type: Type.INTEGER },
      difficulty: { type: Type.STRING, enum: DIFFICULTIES },
      uses: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          required: ["name", "amount"],
          propertyOrdering: ["name", "amount"],
          properties: {
            name: { type: Type.STRING },
            amount: { type: Type.INTEGER },
          },
        },
      },
      missing: { type: Type.ARRAY, items: { type: Type.STRING } },
      steps: {
        type: Type.ARRAY,
        minItems: "3",
        maxItems: "5",
        items: { type: Type.STRING },
      },
    },
  },
};

/** 잘못된 값이 mock 생성기까지 흘러가지 않도록 body 를 정규화한다 */
function normalizeBody(raw: unknown): RecipeRequest | null {
  if (typeof raw !== "object" || raw === null) return null;
  const b = raw as Record<string, unknown>;
  if (!Array.isArray(b.items) || b.items.length === 0) return null;

  const items = b.items
    .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
    .map((i) => ({
      name: String(i.name ?? ""),
      qty: Number.isFinite(Number(i.qty)) ? Number(i.qty) : 1,
      daysLeft: Number.isFinite(Number(i.daysLeft)) ? Number(i.daysLeft) : 0,
    }))
    .filter((i) => i.name !== "");
  if (!items.length) return null;

  return {
    items,
    seasonings: Array.isArray(b.seasonings) ? b.seasonings.map(String) : [],
    time: typeof b.time === "string" ? b.time : "전체",
    diff: typeof b.diff === "string" ? b.diff : "전체",
    minMissing: b.minMissing !== false,
  };
}

function buildPrompt(req: RecipeRequest): string {
  const items = req.items
    .map((i) => `- ${i.name} ${i.qty}개 (유통기한 D-${Math.max(0, i.daysLeft)})`)
    .join("\n");
  const seasonings = req.seasonings.length ? req.seasonings.join(", ") : "없음";
  const conditions = [
    req.time !== "전체" ? `조리 시간 ${req.time} 이내` : null,
    req.diff !== "전체" ? `난이도 ${req.diff}` : null,
    req.minMissing
      ? "냉장고 재료와 보유 양념에 없는 재료는 최대 1개까지만"
      : "없는 재료가 조금 있어도 괜찮음",
  ]
    .filter(Boolean)
    .join("\n- ");

  return `자취생 냉장고 재료:\n${items}\n\n보유 양념·조미료: ${seasonings}\n\n조건:\n- 1인분\n- 유통기한이 임박한 재료를 우선 사용\n- ${conditions}\n\n위 조건에 맞는 레시피 ${MAX_RECIPES}개를 추천해줘.`;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((s) => typeof s === "string");
}

function toUses(v: unknown): RecipeUse[] | null {
  if (!Array.isArray(v)) return null;
  const uses: RecipeUse[] = [];
  for (const u of v) {
    if (typeof u !== "object" || u === null) return null;
    const { name, amount } = u as Record<string, unknown>;
    if (typeof name !== "string" || !name.trim()) return null;
    const n = Number(amount);
    uses.push({ name, amount: Number.isFinite(n) && n >= 1 ? Math.round(n) : 1 });
  }
  return uses;
}

/** 하나라도 형식을 어기면 null 을 돌려 전체를 mock 으로 대체한다 */
function parseRecipes(text: string): Recipe[] | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const recipes: Recipe[] = [];
  for (const r of raw.slice(0, MAX_RECIPES)) {
    if (typeof r !== "object" || r === null) return null;
    const { name, icon, minutes, difficulty, uses, missing, steps } = r as Record<
      string,
      unknown
    >;

    if (typeof name !== "string" || !name.trim()) return null;
    if (typeof icon !== "string" || !ICON_KEYS.includes(icon)) return null;
    if (typeof minutes !== "number" || !Number.isFinite(minutes)) return null;
    if (typeof difficulty !== "string" || !DIFFICULTIES.includes(difficulty))
      return null;
    if (!isStringArray(missing)) return null;
    if (!isStringArray(steps) || steps.length === 0) return null;

    const parsedUses = toUses(uses);
    if (!parsedUses) return null;

    recipes.push({
      name: name.trim(),
      icon,
      minutes: Math.round(minutes),
      difficulty,
      uses: parsedUses,
      missing,
      steps,
    });
  }

  return recipes.length ? recipes : null;
}

function fallback(req: RecipeRequest) {
  return NextResponse.json({ recipes: getMockRecipes(req), isFallback: true });
}

export async function POST(request: Request) {
  let body: RecipeRequest | null = null;

  try {
    body = normalizeBody(await request.json().catch(() => null));
    if (!body) {
      return NextResponse.json(
        { error: "items 는 1개 이상의 배열이어야 합니다." },
        { status: 400 }
      );
    }

    // 키가 없으면 AI 를 호출하지 않고 바로 mock 으로 응답한다
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return fallback(body);

    const ai = new GoogleGenAI({ apiKey });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let text: string | undefined;
    try {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-3.8-flash",
        contents: buildPrompt(body),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RECIPE_SCHEMA,
          maxOutputTokens: 2500,
          abortSignal: controller.signal,
        },
      });
      text = response.text;
    } finally {
      clearTimeout(timer);
    }

    if (!text) {
      console.error("[api/recipe] 빈 응답 — mock 으로 대체합니다.");
      return fallback(body);
    }

    const recipes = parseRecipes(text);
    if (!recipes) {
      console.error("[api/recipe] 응답 검증 실패 — mock 으로 대체합니다.");
      return fallback(body);
    }

    return NextResponse.json({ recipes, isFallback: false });
  } catch (err) {
    // 키 값이 로그에 섞이지 않도록 메시지만 남긴다
    console.error(
      "[api/recipe] Gemini 호출 실패 — mock 으로 대체합니다:",
      err instanceof Error ? err.message : err
    );
    if (body) return fallback(body);
    return NextResponse.json(
      { error: "레시피를 만들지 못했습니다." },
      { status: 400 }
    );
  }
}
