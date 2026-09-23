---
name: supabase-leaderboard
description: Supabase를 이용한 게임 랭킹 저장과 조회. leaderboard 테이블, RLS 정책, Supabase 클라이언트 설정, 랭킹 등록 폼, TOP 10 목록을 만들거나 고칠 때 반드시 사용한다. "랭킹", "리더보드", "Supabase", "DB", "닉네임 등록", "점수 저장" 같은 말이 나오면 이 스킬을 사용한다.
---

# Supabase 랭킹

## 원칙
- 랭킹은 부가 기능이다. **Supabase가 실패해도 게임은 끝까지 진행된다.** 랭킹 영역에만 "랭킹을 불러올 수 없어요"를 표시한다.
- 로그인 없음. 익명 사용자는 insert와 select만 할 수 있다.

## 테이블 만들기
Supabase 대시보드 → SQL Editor에서 실행하도록 사용자에게 안내한다:
```sql
create table leaderboard (
  id bigint generated always as identity primary key,
  nickname text not null check (char_length(nickname) between 1 and 10),
  score integer not null check (score between 0 and 2000),
  created_at timestamptz not null default now()
);

alter table leaderboard enable row level security;

create policy "누구나 조회" on leaderboard
  for select to anon using (true);

create policy "누구나 등록" on leaderboard
  for insert to anon with check (true);
```
update와 delete 정책은 만들지 않는다 (다른 사람 점수 수정 방지).

## 클라이언트 설정
- 패키지: `@supabase/supabase-js`
- `src/lib/supabase.ts`에서 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`로 생성
- 환경 변수가 없으면 `null`을 export하고, 쓰는 곳에서 null이면 안내 문구 표시
- anon 키는 공개돼도 되는 키다 (RLS가 권한을 막는다). **service_role 키는 절대 사용하지 않는다**

## 함수 (src/lib/leaderboard.ts)
```ts
getTopScores(): Promise<{ nickname: string; score: number }[] | null>
  // score 내림차순, 같으면 created_at 오름차순, limit 10. 실패 시 null
submitScore(nickname: string, score: number): Promise<boolean>
  // 성공 true, 실패 false. 예외를 밖으로 던지지 않는다
```

## 화면
- 시작 화면: TOP 10 표시 (1~3위는 🥇🥈🥉)
- 결과 화면: 닉네임 입력(공백 제거, 1~10자) → "랭킹 등록" → 성공 시 "등록 완료!"로 바꾸고 비활성화 → TOP 10 다시 불러오기
- 등록 중에는 버튼 비활성화 (중복 등록 방지)
- 방금 등록한 기록이 TOP 10에 있으면 배경색으로 강조
