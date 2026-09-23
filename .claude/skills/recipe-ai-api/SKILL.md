---
name: recipe-ai-api
description: 선택한 재료로 요리를 추천하는 Claude API 연동과 실패 시 대체 레시피 전환 방법. app/api/recipe/route.ts, AI 프롬프트, JSON 파싱, 타임아웃, mockRecipes 대체 로직을 만들거나 고칠 때 반드시 사용한다. "AI", "API", "레시피 추천", "요리하기 버튼", "Claude", "응답이 안 와요", "JSON 에러" 같은 말이 나오면 이 스킬을 사용한다.
---

# 레시피 AI API

## 절대 원칙
1. **시연 중 절대 멈추지 않는다.** AI 호출이 어떤 이유로든 실패하면 대체 레시피를 반환한다. 사용자에게 에러 화면을 보여주지 않는다.
2. **API 키는 서버에서만.** `ANTHROPIC_API_KEY`는 route.ts에서만 읽는다. `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
3. **키가 없어도 동작한다.** 환경 변수가 없으면 AI를 호출하지 않고 바로 대체 레시피를 반환한다.

## 파일 구성
- `src/app/api/recipe/route.ts`: POST 핸들러
- `src/lib/prompt.ts`: 시스템 프롬프트와 사용자 메시지 생성 함수
- `src/lib/fallback.ts`: 대체 레시피 선택 함수 (서버와 클라이언트 양쪽에서 사용)
- `src/lib/parseRecipe.ts`: AI 응답 문자열 → `Recipe` 변환과 검증

## 요청 / 응답
요청 body:
```ts
{ ingredients: { name: string; daysLeft: number }[]; mission: Mission; previousDishes: string[] }
```
응답은 항상 200 상태로 `{ recipe: Recipe, isFallback: boolean }`을 반환한다. (재료가 2개 미만인 잘못된 요청만 400)

## route.ts 흐름
1. body 검증
2. 키 없음 → 대체 레시피 반환
3. `fetch("https://api.anthropic.com/v1/messages")` 호출
   - 헤더: `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`
   - 모델: `process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5"`
   - `max_tokens: 1000`
   - `AbortController`로 **8초 타임아웃**
4. 응답 `content`에서 `type === "text"` 블록만 합쳐 문자열로 만든다
5. ```` ```json ````, ```` ``` ```` 제거 → 첫 `{`부터 마지막 `}`까지 잘라서 `JSON.parse`
6. `parseRecipe`로 필드 검증. 하나라도 이상하면 대체 레시피
7. 전체를 하나의 try/catch로 감싸고, catch에서는 `console.error` 후 대체 레시피 반환

## 시스템 프롬프트 (src/lib/prompt.ts)
```
당신은 "냉장고 셰프"입니다. 요리 초보 자취생이 냉장고 재료로 한 끼를 해결하도록 돕습니다.

규칙:
- 사용자가 준 재료로 만들 수 있는 1인분 요리 1개를 추천합니다.
- 소금, 간장, 설탕, 식용유는 기본으로 있다고 가정합니다.
- 없는 재료는 꼭 필요할 때만 missing_ingredients에 최대 2개까지 넣습니다.
- 유통기한이 1일 이하인 재료를 우선 사용합니다.
- 미션의 조리도구와 시간 조건을 지킵니다. 지키지 못하면 mission_success를 false로 하고 이유를 mission_comment에 씁니다.
- 이상한 조합이어도 먹을 수 있는 요리를 창의적으로 만듭니다.
- 조리 순서는 최대 5단계, "중불에서 3분", "숟가락 1개"처럼 구체적으로 씁니다.
- 육류와 계란은 속까지 완전히 익히라고 안내합니다. 전자레인지에 금속 용기나 껍질째 계란을 넣는 등 위험한 방법은 절대 안내하지 않습니다.
- 이전에 만든 요리는 다시 추천하지 않습니다.
- chef_comment는 자취생에게 건네는 재밌고 짧은 한마디입니다.

반드시 아래 JSON만 출력합니다. 설명, 마크다운, 코드블록 기호는 쓰지 않습니다.
{"name":"","emoji":"","time_minutes":0,"used_ingredients":[],"missing_ingredients":[],"mission_success":true,"mission_comment":"","steps":[],"chef_comment":""}
```

사용자 메시지에는 재료(이름과 D-n), 미션 제목과 조건, 사용 가능한 조리도구, 이전 요리 목록을 줄바꿈으로 나열한다.

## parseRecipe 검증
- `name`, `emoji`, `mission_comment`, `chef_comment`: 문자열 (emoji가 비면 "🍳")
- `time_minutes`: 숫자 (아니면 10으로 보정)
- `used_ingredients`, `missing_ingredients`, `steps`: 문자열 배열
- `missing_ingredients`는 앞에서 2개, `steps`는 앞에서 5개만 사용
- `name`이나 `steps`가 비어 있으면 실패로 간주

## 대체 레시피 선택 (src/lib/fallback.ts)
- 선택 재료 이름과 mock 레시피의 `keyIngredients`가 겹치는 개수가 가장 많은 것을 고른다
- 동점이면 `previousDishes`에 없는 것을 우선, 모두 만들었으면 아무거나
- 반환할 때 `used_ingredients`는 **선택한 재료로 덮어쓴다**

## 클라이언트 호출
- "요리하기" 클릭 → 버튼 비활성화 → 끓는 애니메이션 → `fetch("/api/recipe")`
- 클라이언트 fetch도 try/catch로 감싸고, 실패하면 `fallback.ts`를 직접 호출해 결과를 띄운다
- 로딩 애니메이션은 최소 1.5초 보여준다 (너무 빨리 끝나면 게임 느낌이 안 난다)
