---
name: deploy-check
description: git push와 Vercel 배포 전에 반드시 실행하는 점검 절차. 커밋, 푸시, 배포, 빌드 실패, 환경 변수, "Vercel에서 안 돼요", "로컬에선 되는데" 같은 상황이면 항상 이 스킬을 사용한다. 작업 단계 하나를 끝냈을 때도 이 스킬로 점검한 뒤 푸시를 안내한다.
---

# 배포 전 점검

해커톤 마감은 16:00이며 배포된 URL로만 시연한다. 배포 실패가 가장 큰 위험이다.
사용자는 Git Bash를 처음 쓰는 초보자이므로 명령어는 한 줄씩, 무엇을 하는지 한국어로 설명한다.

## 푸시 전 점검 (순서대로)
1. `npm run lint` → 오류 수정
2. `npm run build` → **반드시 성공해야 푸시한다.** `npm run dev`에서 되는 것은 기준이 아니다
   - 타입 오류는 `any`로 덮지 말고 타입을 맞춰 고친다
   - 사용하지 않는 import와 변수를 제거한다
3. `git status`로 `.env`, `.env.local`이 목록에 없는지 확인. 있으면 `.gitignore`에 `.env*` 추가 후 `git rm --cached .env.local`
4. 커밋과 푸시:
   ```bash
   git add .
   git commit -m "무엇을 했는지 짧게"
   git push
   ```

## Vercel 환경 변수
Vercel 프로젝트 → Settings → Environment Variables에 등록 (Production, Preview 체크):
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (선택) `ANTHROPIC_MODEL`

**등록하거나 바꾼 뒤에는 반드시 Deployments → 최신 배포 → Redeploy.** 환경 변수는 재배포해야 적용된다.

## 배포 후 확인 (배포 URL에서 직접)
- [ ] 시작 화면이 열리고 랭킹이 보인다
- [ ] "빠른 시연"으로 3라운드를 끝까지 진행할 수 있다
- [ ] 요리 결과가 AI 응답으로 나온다 (Vercel → Logs에서 대체 데이터 사용 여부 확인)
- [ ] 결과 화면에서 랭킹 등록이 된다
- [ ] 휴대폰으로 열어도 화면이 깨지지 않는다

## 빌드 실패 시
- Vercel → Deployments → 실패한 배포 → Build Logs에서 **첫 번째 에러**를 찾는다
- 로컬에서 `npm run build`로 같은 에러를 재현한 뒤 고친다
- `Module not found`: import 경로의 대소문자를 확인한다 (Windows는 구분하지 않지만 Vercel은 구분한다)

## 시간 규칙
- 대체 데이터로 게임이 끝까지 동작하면 즉시 배포
- 15:00 이후 새 기능 금지, 버그 수정과 리허설만
- 15:30 전까지 시연 경로를 화면 녹화
