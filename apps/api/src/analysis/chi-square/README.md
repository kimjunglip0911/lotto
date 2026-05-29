# chi-square API (`/api/analysis/chi-square`)

## 목적

카이제곱 검정 분석 화면용 당첨·회차 조회를 담당합니다. combination·recommend 화면도 동일 주소를 사용합니다.

## 폴더

```text
chi-square/
├── README.md
├── chi.module.ts
├── controller/
│   └── chi.controller.ts
├── service/
│   └── chi.service.ts
└── queries/
    └── win.queries.ts
```

## 엔드포인트

| 메서드 | 경로 | 설명 |
|:---|:---|:---|
| GET | `/api/analysis/chi-square/draw-numbers` | 저장된 회차 번호 목록 |
| GET | `/api/analysis/chi-square/winning-number?draw_no=` | 회차별 당첨번호 1건 |
| GET | `/api/analysis/chi-square/winning-numbers-range?draw_no=` | 해당 회차 이전 당첨 목록 |

## 웹 연동

- `apps/web/src/app/analysis/chi-square/api/core/url.ts`
- `apps/web/src/app/recommend/api/core/url.ts` (`chiSquareApiUrl`)
- `apps/web/src/app/analysis/combination/api/loadHistory.ts`

**주의:** 위 경로의 URL 세그먼트 `analysis/chi-square`는 변경하지 마세요.

## 환경·DB

- SQLite: `lotto_winners`
- DB 경로: 루트 `apps/api/README.md`의 `LOTTO_DB_PATH` 참고

## 실행·검증

```bash
npm run dev:api
npm run test -w api
```
