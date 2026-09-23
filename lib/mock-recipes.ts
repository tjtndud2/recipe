import type { Recipe, RecipeRequest } from "./types";

/**
 * 현재 단계용 mock 레시피 풀.
 * icon 은 constants.ts 의 DISH 키를 쓴다 (assets/px 픽셀 아이콘으로 매핑).
 */
const POOL: Recipe[] = [
  {
    name: "김치볶음밥",
    icon: "rice",
    minutes: 15,
    difficulty: "쉬움",
    uses: [
      { name: "김치", amount: 1 },
      { name: "밥", amount: 1 },
      { name: "계란", amount: 1 },
      { name: "기름", amount: 1 },
    ],
    missing: [],
    steps: [
      "김치를 잘게 썰어 기름 두른 팬에 중불로 2분 볶는다",
      "밥을 넣고 김치와 함께 3분 더 볶는다",
      "간장 한 숟갈로 간을 맞춘다",
      "계란 프라이를 올려 완성한다",
    ],
  },
  {
    name: "계란말이",
    icon: "egg",
    minutes: 15,
    difficulty: "쉬움",
    uses: [
      { name: "계란", amount: 3 },
      { name: "대파", amount: 1 },
      { name: "소금", amount: 1 },
    ],
    missing: [],
    steps: [
      "계란 3개를 풀고 잘게 썬 대파와 소금을 넣어 섞는다",
      "약불로 달군 팬에 기름을 두르고 계란물을 반만 붓는다",
      "가장자리가 익으면 한쪽부터 조심스럽게 말아준다",
      "남은 계란물을 붓고 같은 방식으로 말아 완성한다",
    ],
  },
  {
    name: "두부김치",
    icon: "salad",
    minutes: 15,
    difficulty: "쉬움",
    uses: [
      { name: "두부", amount: 1 },
      { name: "김치", amount: 1 },
      { name: "기름", amount: 1 },
    ],
    missing: [],
    steps: [
      "두부를 도톰하게 썰어 끓는 물에 3분 데친다",
      "팬에 기름을 두르고 김치를 신맛이 날아갈 때까지 볶는다",
      "설탕 약간을 넣어 김치의 신맛을 잡는다",
      "접시에 두부를 두르고 가운데 김치를 담아낸다",
    ],
  },
  {
    name: "스팸계란덮밥",
    icon: "rice",
    minutes: 15,
    difficulty: "쉬움",
    uses: [
      { name: "스팸", amount: 1 },
      { name: "계란", amount: 2 },
      { name: "밥", amount: 1 },
      { name: "간장", amount: 1 },
    ],
    missing: [],
    steps: [
      "스팸을 도톰하게 썰어 팬에 노릇하게 굽는다",
      "같은 팬에 계란 2개를 반숙으로 부친다",
      "그릇에 밥을 담고 스팸과 계란을 올린다",
      "간장과 참기름을 살짝 둘러 완성한다",
    ],
  },
  {
    name: "대파계란국",
    icon: "soup",
    minutes: 15,
    difficulty: "쉬움",
    uses: [
      { name: "대파", amount: 1 },
      { name: "계란", amount: 2 },
      { name: "소금", amount: 1 },
    ],
    missing: [],
    steps: [
      "냄비에 물 2컵을 붓고 끓인다",
      "어슷 썬 대파를 넣고 2분 더 끓인다",
      "푼 계란을 원을 그리며 천천히 흘려 넣는다",
      "소금과 후추로 간을 맞추고 불을 끈다",
    ],
  },
  {
    name: "토마토 스파게티",
    icon: "pasta",
    minutes: 30,
    difficulty: "보통",
    uses: [
      { name: "스파게티 면", amount: 1 },
      { name: "토마토 소스", amount: 1 },
      { name: "양파", amount: 1 },
      { name: "마늘", amount: 1 },
    ],
    missing: ["파마산 치즈"],
    steps: [
      "끓는 소금물에 스파게티 면을 8분 삶는다",
      "팬에 기름을 두르고 다진 마늘과 채 썬 양파를 볶는다",
      "토마토 소스를 붓고 중불에서 5분 졸인다",
      "삶은 면을 넣어 소스와 1분 버무린다",
      "후추를 뿌려 마무리한다",
    ],
  },
  {
    name: "삼겹살 김치찜",
    icon: "soup",
    minutes: 60,
    difficulty: "보통",
    uses: [
      { name: "삼겹살", amount: 2 },
      { name: "김치", amount: 1 },
      { name: "양파", amount: 1 },
      { name: "고춧가루", amount: 1 },
    ],
    missing: [],
    steps: [
      "냄비 바닥에 김치를 깔고 삼겹살을 올린다",
      "채 썬 양파와 고춧가루, 물 1컵을 넣는다",
      "뚜껑을 덮고 중불에서 30분 끓인다",
      "국물이 자작해지면 약불로 10분 더 졸인다",
      "대파를 올려 5분 뜸 들인 뒤 낸다",
    ],
  },
  {
    name: "프렌치토스트",
    icon: "toast",
    minutes: 15,
    difficulty: "쉬움",
    uses: [
      { name: "계란", amount: 2 },
      { name: "우유", amount: 1 },
      { name: "설탕", amount: 1 },
    ],
    missing: ["식빵"],
    steps: [
      "계란 2개에 우유와 설탕을 넣고 잘 푼다",
      "식빵을 계란물에 30초씩 앞뒤로 적신다",
      "약불 팬에 버터를 녹이고 양면을 노릇하게 굽는다",
      "먹기 좋게 잘라 접시에 담는다",
    ],
  },
  {
    name: "두부조림",
    icon: "salad",
    minutes: 30,
    difficulty: "보통",
    uses: [
      { name: "두부", amount: 1 },
      { name: "대파", amount: 1 },
      { name: "간장", amount: 1 },
      { name: "고춧가루", amount: 1 },
    ],
    missing: [],
    steps: [
      "두부를 1cm 두께로 썰어 키친타월로 물기를 뺀다",
      "팬에 기름을 두르고 양면을 노릇하게 지진다",
      "간장·고춧가루·설탕·물을 섞어 양념장을 만든다",
      "양념장을 붓고 중불에서 7분 조린다",
      "대파를 올려 1분 더 끓인다",
    ],
  },
  {
    name: "양파스팸볶음",
    icon: "steak",
    minutes: 15,
    difficulty: "쉬움",
    uses: [
      { name: "스팸", amount: 1 },
      { name: "양파", amount: 1 },
      { name: "간장", amount: 1 },
    ],
    missing: [],
    steps: [
      "스팸과 양파를 비슷한 크기로 깍둑 썬다",
      "기름 두른 팬에 스팸을 먼저 2분 볶는다",
      "양파를 넣고 투명해질 때까지 3분 볶는다",
      "간장과 후추로 간을 맞춰 완성한다",
    ],
  },
];

/** '15분' → 15, '전체' → null */
function parseTimeLimit(time: string): number | null {
  const n = parseInt(time, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * 냉장고 재료·양념·필터를 보고 그럴듯한 레시피 3개를 고른다.
 * 실제 AI 호출을 붙이기 전까지 UI 흐름 전체를 시험하기 위한 대체 구현.
 */
export function getMockRecipes(req: RecipeRequest): Recipe[] {
  const owned = new Set([
    ...req.items.map((i) => i.name),
    ...req.seasonings,
  ]);
  const urgent = new Set(
    req.items.filter((i) => i.daysLeft <= 3).map((i) => i.name)
  );

  // 원본 has() 와 같은 양방향 부분 일치
  const have = (name: string) =>
    [...owned].some(
      (o) => o === name || o.includes(name) || name.includes(o)
    );

  const limit = parseTimeLimit(req.time);

  const scored = POOL.map((r) => {
    const matched = r.uses.filter((u) => have(u.name)).length;
    const urgentHit = r.uses.filter((u) =>
      [...urgent].some((n) => n.includes(u.name) || u.name.includes(n))
    ).length;
    const missing = r.uses.filter((u) => !have(u.name)).length + r.missing.length;

    let score = matched * 10 + urgentHit * 6 - missing * 4;
    if (req.minMissing && missing <= 1) score += 8;

    const passesTime = limit === null || r.minutes <= limit;
    const passesDiff = req.diff === "전체" || r.difficulty === req.diff;

    return { recipe: r, score, passes: passesTime && passesDiff };
  });

  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const picked = ranked.filter((s) => s.passes).slice(0, 3);

  // 필터를 만족하는 레시피가 3개에 못 미치면 나머지에서 채운다
  if (picked.length < 3) {
    for (const s of ranked) {
      if (picked.length >= 3) break;
      if (!picked.includes(s)) picked.push(s);
    }
  }

  // 냉장고에 없는 재료는 missing 으로 옮겨 카드에 정확히 표시되게 한다
  return picked.slice(0, 3).map(({ recipe }) => {
    const uses = recipe.uses.filter((u) => have(u.name));
    const extraMissing = recipe.uses
      .filter((u) => !have(u.name))
      .map((u) => u.name);
    return {
      ...recipe,
      uses,
      missing: [...recipe.missing, ...extraMissing],
    };
  });
}
