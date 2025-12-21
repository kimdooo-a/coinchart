# 🚀 Vercel 배포 시 Supabase 설정 가이드

Vercel에 배포한 후 로그인 시 `localhost`로 리다이렉트되는 문제는 **Supabase 대시보드의 URL 설정**이 로컬 환경(`localhost`)에 맞춰져 있기 때문입니다. 

배포된 사이트 주소를 Supabase가 알 수 있도록 설정을 추가해 주어야 합니다.

---

## 1. Supabase 대시보드 접속
1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속하여 해당 프로젝트로 들어갑니다.
2. 좌측 메뉴 하단의 **Authentication** (아이콘: 사람 모양)을 클릭합니다.
3. **Configuration** > **URL Configuration** 메뉴로 이동합니다.

## 2. Site URL 프로덕션 주소로 변경 (선택 사항)
*   **Site URL** 칸에 배포된 Vercel 도메인(예: `https://your-project.vercel.app`)을 입력합니다.
*   *팁: 개발 중에는 `localhost:3000`으로 놔둬도 되지만, Redirect URL 설정을 꼼꼼히 해야 합니다.*

## 3. Redirect URLs 추가 (필수!)
여기가 가장 중요합니다. 로그인 후 돌아올 모든 주소를 허용 리스트에 넣어야 합니다.

1.  **Redirect URLs** 섹션에서 **Add URI**를 클릭합니다.
2.  배포된 Vercel 주소에 `/auth/callback`을 붙여서 입력합니다.
    *   형식: `https://[프로젝트이름].vercel.app/auth/callback`
    *   예: `https://coin-chart-analysis.vercel.app/auth/callback`
3.  (선택) Vercel 미리보기 도메인도 허용하고 싶다면 와일드카드를 사용하세요:
    *   `https://*-[본인vercel아이디].vercel.app/auth/callback`
    *   또는 단순히 `https://*.vercel.app/auth/callback` (보안상 주의 필요)

## 4. Google Cloud Console 설정 (필요한 경우)
Supabase를 거쳐 로그인하므로 **Google Cloud Console의 설정은 바꿀 필요가 없습니다.** 
Google은 Supabase 주소(`https://...supabase.co/...`)로만 리턴하면 되고, 최종적으로 유저를 Vercel 앱으로 보내는 건 Supabase의 역할입니다.

---

## ✅ 요약
**Supabase Authentication > URL Configuration > Redirect URLs** 에
`https://본인도메인/auth/callback` 을 꼭 추가하고 **Save** 하세요!
