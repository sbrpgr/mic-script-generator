# 보안 운영 메모

## 비밀값 관리

- Cloudflare API Token, Account ID, GitHub Token, AdSense 계정 정보는 소스 파일에 직접 저장하지 않습니다.
- 배포 자동화에 필요한 값은 GitHub 저장소의 `Settings > Secrets and variables > Actions`에 Repository Secret으로만 등록합니다.
- 로컬 테스트용 값은 `.env`, `.dev.vars`처럼 Git에서 제외된 파일에만 둡니다.

## 배포 권한

- Cloudflare API Token은 가능한 한 Pages 배포에 필요한 최소 권한으로 생성합니다.
- 토큰을 채팅, 문서, 커밋 메시지, 이슈, README에 붙여넣지 않습니다.
- 토큰이 노출됐다고 의심되면 즉시 Cloudflare/GitHub에서 폐기하고 새로 발급합니다.

## 커밋 전 점검

커밋 전에는 아래처럼 민감정보 패턴을 검색합니다.

```powershell
rg -n --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!.browser-profile/**' --glob '!.cloudflare-dist/**' --glob '!.wrangler/**' "(api[_-]?key|secret|token|password|private[_-]?key|BEGIN .*PRIVATE KEY|ghp_|github_pat_)"
```
