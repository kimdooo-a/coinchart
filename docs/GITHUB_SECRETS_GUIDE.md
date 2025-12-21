# 🔐 GitHub Secrets 설정 가이드

보내주신 스크린샷 화면(**Settings > Secrets and variables > Actions**)에서 다음 단계대로 진행해주세요.

## 1. 새 Secret 만들기
화면 중앙의 초록색 버튼 **[New repository secret]** 을 클릭하세요.

## 2. 추가해야 할 값들 (총 3개)
아래 3개의 값을 하나씩 차례대로 추가해야 합니다.
(기존 `.env.local` 파일에 있는 내용과 동일합니다)

| Name (이름) | Secret (값) | 설명 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://enks...supabase.co` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGcis...` | **중요!** `anon` 키가 아니라 `service_role` 키여야 합니다. (Supabase > Settings > API 에서 확인) |
| `TWELVEDATA_API_KEY` | `37d4...` | Twelve Data API 키 |

> **⚠️ 주의사항**: `SUPABASE_SERVICE_ROLE_KEY`는 관리자 권한이 있는 키이므로 절대 외부에 노출되면 안 됩니다. GitHub Secret에 넣으면 안전하게 보관됩니다.

## 3. 확인
3개를 모두 추가하면 리스트에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TWELVEDATA_API_KEY` 가 표시되어야 합니다.

설정이 완료되면, 오늘 밤 6시(한국 시간)부터 자동으로 데이터가 수집됩니다! 🚀
즉시 테스트해보고 싶다면 **Actions** 탭 > **Daily Data Sync** > **Run workflow** 버튼을 눌러볼 수 있습니다.
