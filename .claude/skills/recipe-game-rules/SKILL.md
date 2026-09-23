---
name: recipe-game-rules
description: 냉장고 파먹기 게임의 규칙, 점수 계산, 데이터 구조의 기준 문서. 게임 화면(/play), 결과 화면(/result), 재료·미션·대체 레시피 데이터, 점수·별점·라운드·유통기한 로직을 만들거나 수정할 때 반드시 먼저 읽는다. "점수", "라운드", "유통기한", "재료", "미션", "냉장고 화면" 같은 말이 나오면 이 스킬을 사용한다.
---

# 냉장고 파먹기 게임 규칙

이 문서가 게임 규칙의 유일한 기준이다. 코드와 이 문서가 다르면 이 문서를 따른다.
해커톤은 1인, 16:00 배포 마감이다. **여기 적히지 않은 기능은 추가하지 않는다.**

## 게임 흐름
1. `/` 시작 화면 → "게임 시작" 또는 "빠른 시연"
2. `/play` 3라운드 진행 (라운드마다 미션 1개, 요리 1번)
3. `/result` 총점, 만든 요리 3개, 썩은 재료 수, 랭킹 등록

## 데이터 파일 (src/data/)
- `ingredients.ts`: 재료 25개. `{ id, name, emoji, category }`
- `missions.ts`: 미션 8개. `{ id, title, condition, tools: string[], maxMinutes?: number, noExtraPurchase?: boolean }`
- `mockRecipes.ts`: 대체 레시피 12개. AI 응답과 같은 `Recipe` 타입 + `keyIngredients: string[]`
- `demo.ts`: 빠른 시연용 고정 재료 9개(D-1 재료 3개 포함)와 고정 미션 3개

## 타입 (src/types/game.ts)
```ts
export interface FridgeItem {
  id: string;
  name: string;
  emoji: string;
  daysLeft: number;      // 남은 유통기한. 0 미만이면 썩음
}

export interface Recipe {
  name: string;
  emoji: string;
  time_minutes: number;
  used_ingredients: string[];
  missing_ingredients: string[];
  mission_success: boolean;
  mission_comment: string;
  steps: string[];
  chef_comment: string;
}

export interface RoundResult {
  round: number;
  recipe: Recipe;
  score: number;
  stars: 1 | 2 | 3;
  isFallback: boolean;   // 대체 데이터 사용 여부 (화면에는 표시하지 않음)
}
```

## 규칙
- 시작 시 재료 풀에서 9개를 랜덤으로 뽑고 `daysLeft`를 1~5 중 랜덤 부여
- 냄비에 2개 이상 담아야 "요리하기" 활성화. 선택은 클릭만 (드래그 없음)
- 라운드 종료 시: 사용한 재료 제거 → 남은 재료 `daysLeft - 1`
- `daysLeft < 0`이면 썩음(🦠 표시, 선택 불가)
- `daysLeft <= 1`이면 빨간 테두리 + 흔들림 애니메이션

## 점수 계산 (src/lib/score.ts, AI가 아니라 코드에서 계산)
| 항목 | 점수 |
|---|---|
| 사용한 재료 1개 | +10 |
| `daysLeft <= 1` 재료 사용 1개 | +20 추가 |
| missing 재료 1개 | -10 |
| 미션 달성 (`mission_success`) | +30 |
| 게임 종료 시 썩은 재료 1개 | -15 |

- 라운드 점수와 총점은 최소 0 (음수 금지)
- 별점: 80 이상 3개, 50 이상 2개, 그 외 1개
- 점수는 **플레이어가 냄비에 담은 재료** 기준으로 계산한다 (AI의 used_ingredients가 아님). AI 응답의 숫자는 신뢰하지 않는다.
- 점수 함수는 순수 함수로 만들고 UI 코드와 분리한다
- 모든 점수 상수는 `score.ts` 상단에 모은다

## 상태 관리
- 외부 상태 라이브러리 사용 금지. `useState` / `useReducer`로 충분하다
- `/result`로 넘길 때는 `sessionStorage`에 JSON으로 저장 (읽기·쓰기 모두 try/catch, 값이 없으면 시작 화면으로 이동)

## 하지 말 것
- 도감, 칭호, 여러 날 진행 모드, 로그인, 드래그 앤 드롭, 사운드
- 새 라이브러리 추가 (필요하면 먼저 사용자에게 물어본다)
