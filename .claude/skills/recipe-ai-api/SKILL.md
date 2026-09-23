---
name: recipe-ai-api
description: 냉장고 재료로 요리를 추천하는 Google Gemini API 연동과 실패 시 대체 레시피 전환 방법. app/api/recipe/route.ts, AI 프롬프트, JSON 파싱, 타임아웃, mock 레시피 대체 로직을 만들거나 고칠 때 반드시 사용한다. "AI", "API", "레시피 추천", "추천 버튼", "Gemini", "Google AI Studio", "GEMINI_API_KEY", "응답이 안 와요", "JSON 에러" 같은 말이 나오면 이 스킬을 사용한다.
---

# 레시피 AI API (Google Gemini)

## 현재 상태
**아직 실제 Gemini 연동은 구현되어 있지 않다.** 추천 버튼은 `lib/mock-recipes.ts` 의 mock 레시피 3개로 동작한다.
이 문서는 "추후 실제 연동할 때 이렇게 한다"는 기준 문서다. 연동 전까지는 `GEMINI_API_KEY` 가 없어도 앱이 정상 동작해야 한다.

## 절대 원칙
1. **API 키는 서버에서만.** `GEMINI_API_KEY` 는 `app/api/recipe/route.ts` 안에서만 읽는다.
   - `NEXT_PUBLIC_` 접두사를 **절대** 붙이지 않는다.
   - `page.tsx`, Client Component, 브라우저 JavaScript, `localStorage` 에 키를 두지 않는다.
   - 클라이언트 번들에 `@google/genai` 를 import 하지 않는다.
2. **Anthropic / Claude API 는 쓰지 않는다.** `window.claude.complete()`, `api.anthropic.com`, `@anthropic-ai/sdk`, `ANTHROPIC_API_KEY` 는 이 프로젝트에서 금지다.
3. **시연 중 절대 멈추지 않는다.** AI 호출이 어떤 이유로든 실패하면 mock 레시피를 반환한다. 사용자에게 에러 화면을 보여주지 않는다.
4. **키가 없어도 동작한다.** 환경 변수가 없으면 AI를 호출하지 않고 바로 mock 레시피를 반환한다.

## 파일 구성
- `lib/recipe.ts`: UI가 호출하는 유일한 진입점 `requestRecipes(req)`. 지금은 mock 을 돌려주고, 연동 시 이 함수 본문만 `fetch("/api/recipe", ...)` 로 바꾼다.
- `lib/mock-recipes.ts`: `getMockRecipes(req)` — 재료·양념·필터로 레시피 3개를 고르는 대체 구현. 서버와 클라이언트 양쪽에서 쓸 수 있다.
- `lib/types.ts`: `Recipe`, `RecipeRequest` 타입 정의.
- `app/api/recipe/route.ts`: **(미구현)** POST 핸들러. 연동 단계에서 새로 만든다.

## 요청 / 응답
요청 body 는 `RecipeRequest` 를 그대로 쓴다:
```ts
{
  items: { name: string; qty: number; daysLeft: number }[];
  seasonings: string[];
  time: string;      // '전체' | '15분' | '30분' | '60분'
  diff: string;      // '전체' | '쉬움' | '보통'
  minMissing: boolean;
}
```
응답은 항상 200 으로 `{ recipes: Recipe[], isFallback: boolean }` 을 반환한다. (`items` 가 비어 있는 잘못된 요청만 400)

`Recipe` 는 반드시 아래 형태다:
```ts
{
  name: string;
  icon: string;        // soup|rice|egg|noodle|pasta|toast|sandwich|burger|steak|
                       // chicken|mandu|pizza|salad|skewer|hotdog|taco|pancake|sushi
  minutes: number;
  difficulty: "쉬움" | "보통" | "어려움";
  uses: { name: string; amount: number }[];
  missing: string[];
  steps: string[];     // 3~5개
}
```
`icon` 은 `lib/constants.ts` 의 `DISH` 키여야 한다. 그래야 `lib/icons.ts` 의 `dishIcon()` 이 `public/assets/px/*.png` 픽셀 아이콘으로 매핑한다.

## SDK
공식 **`@google/genai`** SDK 를 사용한다. 직접 `fetch` 로 REST 를 때리지 않는다.

```bash
npm install @google/genai   # 실제 연동 단계에서만 설치. 지금은 package.json 에 추가하지 않는다.
```

```ts
// app/api/recipe/route.ts (서버 전용)
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
```

(참고: SDK 없이 직접 호출해야 할 경우의 REST 엔드포인트는
`https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` 이다.)

## route.ts 흐름
1. body 검증 (`items` 가 배열이고 1개 이상)
2. `process.env.GEMINI_API_KEY` 없음 → `getMockRecipes(body)` 로 `{ recipes, isFallback: true }` 반환
3. `ai.models.generateContent({ model, contents, config })` 호출
   - `config.systemInstruction` 에 아래 시스템 프롬프트
   - `config.responseMimeType: "application/json"` 으로 JSON 만 받는다 (가능하면 `responseSchema` 도 지정)
   - `config.maxOutputTokens: 2500`
   - `AbortController` 로 **8초 타임아웃**
4. `response.text` 에서 ```` ```json ````, ```` ``` ```` 제거 → 첫 `[` 부터 마지막 `]` 까지 잘라 `JSON.parse`
5. 배열 길이·필수 필드·`icon` 이 `DISH` 키인지 검증. 하나라도 이상하면 mock 레시피
6. 최대 3개로 자른다
7. 전체를 하나의 try/catch 로 감싸고, catch 에서는 `console.error` 후 mock 레시피 반환

## 시스템 프롬프트
```
당신은 자취생을 위한 요리 도우미입니다. 냉장고에 있는 재료로 오늘 한 끼를 해결하도록 돕습니다.

규칙:
- 사용자가 준 냉장고 재료와 보유 양념으로 만들 수 있는 1인분 요리 3개를 추천합니다.
- 유통기한이 임박한(daysLeft가 작은) 재료를 우선 사용합니다.
- 보유 양념 목록에 있는 것만 있다고 가정합니다. 물은 항상 있다고 가정합니다.
- minMissing이 true면 냉장고와 보유 양념 모두에 없는 재료는 최대 1개까지만 씁니다.
- time 조건이 '전체'가 아니면 minutes가 그 시간 이내여야 합니다.
- diff 조건이 '전체'가 아니면 difficulty가 그 난이도여야 합니다.
- uses의 amount는 1 이상의 정수입니다. steps는 3~5개이며 "중불에서 3분"처럼 구체적으로 씁니다.
- 육류와 계란은 속까지 완전히 익히라고 안내합니다. 전자레인지에 금속 용기나 껍질째 계란을 넣는 등 위험한 방법은 절대 안내하지 않습니다.

반드시 아래 JSON 배열만 출력합니다. 설명, 마크다운, 코드블록 기호는 쓰지 않습니다.
[{"name":"","icon":"","minutes":0,"difficulty":"","uses":[{"name":"","amount":1}],"missing":[],"steps":[]}]
```

사용자 메시지에는 냉장고 재료(이름·수량·D-n), 보유 양념 목록, 조리시간·난이도·`없는 재료 최소화` 조건을 줄바꿈으로 나열한다.

## 클라이언트 쪽 교체
`lib/recipe.ts` 의 `requestRecipes()` 본문만 바꾸면 되고, UI(`app/fridge/page.tsx`, `components/RecipeCard.tsx`, `components/RecipeDetail.tsx`)는 손대지 않는다.

```ts
export async function requestRecipes(req: RecipeRequest): Promise<Recipe[]> {
  const res = await fetch("/api/recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const { recipes } = await res.json();
  return recipes;
}
```
