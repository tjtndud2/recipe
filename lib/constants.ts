// 원본: design-reference/냉장고RPG/*.dc.html 의 상수를 그대로 옮긴 것.
// 세 파일에 중복돼 있어 가장 최신판인 "냉장고 레시피.dc.html" 을 정본으로 삼았다.

export const DAY = 86400000;

export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

/** localStorage / sessionStorage 키 (원본과 동일하게 유지) */
export const KEY = "pixelFridge.v1";
export const S_KEY = "pixelFridge.seasonings";
export const PLANT_KEY = "pixelFridge.plant";
export const ENERGY_KEY = "pixelFridge.energy";
export const SMELL_KEY = "pixelFridge.smell";
export const FROM_FRIDGE_KEY = "pf.fromFridge";

/** 첫 시작 시 냉장고에 채워 넣을 재료: [이름, 수량, 남은 일수] */
export const SEED: [string, number, number][] = [
  ["계란", 6, 5],
  ["양파", 2, 7],
  ["두부", 1, 1],
  ["김치", 1, 12],
  ["대파", 1, 3],
  ["스팸", 1, 90],
  ["우유", 1, 2],
  ["밥", 2, 1],
  ["삼겹살", 2, 4],
  ["스파게티 면", 5, 50],
  ["토마토 소스", 5, 7],
];

/** 재료 이름 → assets/px 픽셀 아이콘 키 (부분 일치, 긴 키 우선) */
export const ICONS: [string, string][] = [
  ["계란", "egg"],
  ["달걀", "egg"],
  ["양파", "onion"],
  ["두부", "tofu"],
  ["김치", "kimchi"],
  ["양배추", "a71"],
  ["배추", "a71"],
  ["상추", "a92"],
  ["대파", "leek"],
  ["부추", "a30"],
  ["파", "leek"],
  ["스팸", "spam"],
  ["토마토 소스", "tsauce"],
  ["토마토소스", "tsauce"],
  ["스파게티", "spaghetti"],
  ["햄", "b54"],
  ["베이컨", "b54"],
  ["참치", "b41"],
  ["생선", "b41"],
  ["우유", "milk"],
  ["밥", "rice"],
  ["쌀", "rice"],
  ["고구마", "a60"],
  ["감자", "a60"],
  ["당근", "a06"],
  ["토마토", "a19"],
  ["삼겹", "pork"],
  ["돼지", "b23"],
  ["소고기", "b23"],
  ["고기", "b23"],
  ["닭", "b01"],
  ["버섯", "a64"],
  ["마늘", "garlic"],
  ["고추", "a35"],
  ["라면", "b30"],
  ["국수", "b30"],
  ["파스타", "b91"],
  ["면", "b30"],
  ["식빵", "b64"],
  ["토스트", "b82"],
  ["빵", "b64"],
  ["소시지", "b21"],
  ["사과", "a04"],
  ["바나나", "a12"],
  ["레몬", "a20"],
  ["오이", "a54"],
  ["애호박", "a27"],
  ["호박", "a27"],
  ["가지", "a33"],
  ["옥수수", "a91"],
  ["브로콜리", "a47"],
  ["콩", "a51"],
  ["딸기", "a11"],
  ["포도", "a76"],
  ["시리얼", "b72"],
  ["요거트", "b51"],
  ["만두", "b04"],
  ["주스", "b74"],
  ["커피", "b81"],
  ["치킨", "b01"],
];

/** 완성 요리 아이콘 키 */
export const DISH: Record<string, string> = {
  soup: "b30",
  rice: "rice",
  egg: "b70",
  noodle: "b91",
  pasta: "b91",
  toast: "b82",
  sandwich: "b60",
  burger: "b22",
  steak: "b23",
  chicken: "b01",
  mandu: "b04",
  pizza: "b00",
  salad: "b62",
  skewer: "b93",
  hotdog: "b21",
  taco: "b32",
  pancake: "b03",
  sushi: "b41",
};

export const SEASONINGS = [
  "기름",
  "참기름",
  "들기름",
  "고추장",
  "된장",
  "간장",
  "참치액",
  "설탕",
  "소금",
  "후추",
  "식초",
  "고춧가루",
  "굴소스",
  "깨",
  "불닭소스",
];

export const S_COLOR: Record<string, string> = {
  기름: "#f0d060",
  참기름: "#b8762a",
  들기름: "#8a6a2a",
  고추장: "#c0322b",
  된장: "#8d5330",
  간장: "#3b2418",
  참치액: "#6b4a3a",
  설탕: "#ffffff",
  소금: "#eef2f5",
  후추: "#4a4a4a",
  식초: "#e8e0b0",
  고춧가루: "#d8433b",
  굴소스: "#5a3a2a",
  깨: "#e8d8a8",
  불닭소스: "#ff5a2a",
};

export const S_DEFAULT: Record<string, boolean> = {
  기름: true,
  간장: true,
  설탕: true,
  소금: true,
  후추: true,
  고추장: true,
};

export const TIMES = ["전체", "15분", "30분", "60분"];
export const DIFFS = ["전체", "쉬움", "보통"];
export const SHIRTS = ["#6f9fd8", "#d8433b", "#5aa83c", "#f7b733"];

/** 캐릭터 도트 (10열). 마지막 2행은 LEGS[frame] 이 붙는다. */
export const CHAR = [
  "..HHHHHH..",
  ".HHHHHHHH.",
  ".HHSSSSHH.",
  ".HSSSSSSH.",
  ".SSESSESS.",
  ".SSSSSSSS.",
  "..SSMMSS..",
  "...SSSS...",
  ".TTTTTTTT.",
  "STTTTTTTTS",
  "STTTTTTTTS",
  ".PPPPPPPP.",
];

export const LEGS = [
  [".PPP..PPP.", ".BBB..BBB."],
  [".PPP...PP.", ".BBB...BB."],
  [".PPP..PPP.", ".BBB..BBB."],
  ["..PP..PPP.", "..BB..BBB."],
];

/** 화분 성장 단계별 도트 (8열) */
export const PLANT = [
  [
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    "...DG...",
    "....G...",
  ],
  [
    "........",
    "........",
    "........",
    "........",
    ".GG.....",
    "..GD.GG.",
    "...DDG..",
    "....D...",
  ],
  [
    "........",
    "........",
    "..GG....",
    ".GGD.GG.",
    "...DGGG.",
    ".GGD....",
    "..GGD...",
    "....D...",
  ],
  [
    "...FF...",
    "..FYYF..",
    "...FF...",
    "....D...",
    ".GG.D.GG",
    "..GGDGG.",
    "...GD...",
    "....D...",
  ],
];

/** 거실 좌표 (%): 냉장고 / 화분 */
export const FX = 13.5;
export const FY = 66;
export const PX = 58;
export const PY = 52;
