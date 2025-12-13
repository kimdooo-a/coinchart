# 🌐 Google OAuth 설정 가이드 (for Supabase)

Supabase의 Google 설정을 채우기 위해서는 **Google Cloud Console**에서 `Client ID`와 `Client Secret`을 발급받아야 합니다. 과정이 조금 복잡할 수 있으니 천천히 따라와 주세요.

---

## 1단계: Google Cloud Console 접속
1.  [Google Cloud Console (https://console.cloud.google.com/)](https://console.cloud.google.com/)에 접속합니다.
2.  로그인 후, 좌측 상단 로고 옆의 **프로젝트 선택**을 클릭합니다.
3.  **"새 프로젝트(New Project)"**를 클릭해 프로젝트를 하나 만듭니다. (이름은 `CryptoChart` 등 자유롭게)

## 2단계: OAuth 동의 화면 구성 (Consent Screen)
1.  좌측 메뉴에서 **API 및 서비스(APIs & Services)** > **OAuth 동의 화면(OAuth consent screen)**으로 이동합니다.
2.  **User Type**을 **"외부(External)"**로 선택하고 **만들기(Create)**를 누릅니다.
3.  **앱 정보 입력**:
    *   **앱 이름**: `Crypto Chart` (사용자에게 표시될 이름)
    *   **사용자 지원 이메일**: 본인 이메일 선택
    *   **개발자 연락처 정보**: 본인 이메일 입력
    *   나머지는 비워둬도 됩니다. -> **저장 후 계속(Save and Continue)**
4.  **범위(Scopes)** 페이지는 그냥 맨 아래 **저장 후 계속**을 누릅니다.
5.  **테스트 사용자(Test users)** 페이지도 그냥 **저장 후 계속**을 누릅니다. (나중에 앱 게시 상태를 '프로덕션'으로 바꾸면 됩니다)
6.  **요약** 페이지에서 **대시보드로 돌아가기**를 누릅니다.
7.  **(중요)** 'OAuth 동의 화면' 메인에서 **"앱 게시(Publish App)"** 버튼이 있다면 눌러서 **프로덕션** 상태로 만듭니다. (테스트 모드면 7일마다 토큰이 만료됩니다)

## 3단계: 자격 증명 만들기 (Credentials)
1.  좌측 메뉴에서 **자격 증명(Credentials)**을 클릭합니다.
2.  상단의 **+ 자격 증명 만들기(+ Create Credentials)** > **OAuth 클라이언트 ID(OAuth client ID)**를 선택합니다.
3.  **애플리케이션 유형**: **웹 애플리케이션(Web application)** 선택.
4.  **이름**: `Supabase Auth` (식별용, 아무거나 상관없음)
5.  **(가장 중요) 승인된 리디렉션 URI (Authorized redirect URIs)**:
    *   **URI 추가**를 클릭합니다.
    *   여기에 **Supabase 화면에 있던 Callback URL**을 복사해서 붙여넣습니다.
    *   예: `https://enksnhshciyvllwfiwrm.supabase.co/auth/v1/callback` (사용자분의 스크린샷 하단에 있는 주소를 정확히 복사하세요!)
6.  **만들기(Create)** 버튼 클릭.

## 4단계: ID와 Secret 복사하여 Supabase에 붙여넣기
1.  생성 완료 팝업이 뜨면 **클라이언트 ID(Client ID)**와 **클라이언트 보안 비밀(Client Secret)**이 보입니다.
2.  각각 복사해서 **Supabase 설정 화면**의 해당 칸에 붙여넣습니다.
3.  Supabase 화면 하단의 **Save** 버튼을 누릅니다.

---

## 🎉 완료!
이제 다시 웹사이트(`http://localhost:3000`)로 돌아가서 로그인을 시도해 보세요.
