# 작업 기록

## 2026-04-28 기준 완료 사항

### 기능

- Web Speech API 기반 한국어 음성 텍스트 변환 유지
- 녹음 시작, 일시정지, 종료, 재시작 흐름 정리
- 브라우저 음성 인식이 끊길 때 자동 재시도 지연값 조정
- 텍스트 드래그 선택 시 `선택 복사` 버튼 표시
- 완성 대본 복사 및 TXT 저장 기능 유지
- 제목 옆 작은 `?` 사용법 버튼 추가
- 사용법 모달 추가

### UI

- 32인치 모니터에서도 과도하게 넓어지지 않도록 앱 폭 제한 유지
- 카드 반경 8px 기준의 단정한 작업형 UI 유지
- 모바일에서 컨트롤과 패널이 세로로 정리되도록 반응형 유지
- 향후 AdSense 삽입을 위해 상단, 하단, 좌우 레일 광고 슬롯 구조 추가
- 빈 광고 슬롯은 표시하지 않아 현재 사용 화면을 유지

### 배포

- Git 저장소 초기화
- GitHub 저장소 생성: `https://github.com/sbrpgr/mic-script-generator`
- `main` 브랜치 push 완료
- Cloudflare Pages 프로젝트: `mic-script-generator`
- 운영 도메인: `https://ko-workspace.com/`
- GitHub Actions 자동 배포 구성
- GitHub Secrets 등록:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`
- GitHub Actions 배포 성공 확인

### 보안

- `_headers` 보안 헤더 구성
- CSP, Referrer-Policy, Permissions-Policy, X-Frame-Options, X-Content-Type-Options 적용
- `.gitignore`에 로컬 프로필, 빌드 산출물, 환경 파일, 토큰 파일, 인증서/키 파일 제외
- `SECURITY.md` 작성
- 민감정보 패턴 검색 수행
- 토큰은 GitHub Secrets로만 관리
- AdSense inline script 없이 외부 스크립트와 `app.js` 초기화로 대응할 수 있게 준비

### SEO

- 서비스명 변경: `음성으로 텍스트 쓰기`
- title, meta description, canonical, Open Graph, Twitter Card 구성
- JSON-LD 구조화 데이터 추가
- `robots.txt`, `sitemap.xml`, `favicon.svg`, `site.webmanifest` 추가
- `pages.dev` 중복 주소에 `X-Robots-Tag: noindex` 적용

### 정책/운영 문서

- `privacy.html` 추가
- `terms.html` 추가
- `DEPLOYMENT.md` 작성
- `SECURITY.md` 작성
- `PROJECT_SPEC.md` 작성

## 현재 남은 이슈

- `www.ko-workspace.com`은 Cloudflare Pages custom domain에 추가됐지만 DNS CNAME이 없어 pending 상태
- DNS에 아래 레코드 필요:
  - Type: `CNAME`
  - Name: `www`
  - Target: `mic-script-generator.pages.dev`
  - Proxy: On
  - TTL: Auto
- AdSense 승인 전 `ads.txt`의 Publisher ID 교체 필요
- Google Search Console에 `https://ko-workspace.com/sitemap.xml` 제출 필요
