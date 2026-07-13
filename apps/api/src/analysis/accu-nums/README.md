# accu-nums API (`/api/analysis/accu-nums`)

## 목적

누적 번호 분석 화면용 당첨·회차 조회와 분석 스냅샷(4개 번호) 저장·조회를 담당합니다.

## 폴더

```text
accu-nums/
├── accu-nums.module.ts
├── controller/
│   ├── accu-nums.routes.base.ts
│   ├── accu-nums.controller.ts
│   └── accu-nums.legacy.controller.ts
├── service/
│   ├── accu-nums.service.ts
│   └── snapshot.service.ts
├── queries/
│   ├── win.queries.ts
│   └── snap.queries.ts
├── repository/
│   └── snapshot.repository.ts
└── helpers/
    └── snapshot.valid.ts
```

## 엔드포인트

신규·구 URL 모두 동일 동작입니다. 구 URL은 `accumulated-numbers` 세그먼트를 씁니다.

| 메서드 | 경로(신규) | 설명 |
|:---|:---|:---|
| GET | `/api/analysis/accu-nums/draw-numbers` | 저장된 회차 번호 목록 |
| GET | `/api/analysis/accu-nums/winning-numbers-range?draw_no=` | 해당 회차 이전 당첨 목록 |
| GET | `/api/analysis/accu-nums/winning-number?draw_no=` | 회차별 당첨번호 1건 |
| GET | `/api/analysis/accu-nums/winning-numbers-window?draw_no=&window_size=` | 이전 N회차 당첨 목록 |
| POST | `/api/analysis/accu-nums/snapshot` | 분석 스냅샷 저장 |
| GET | `/api/analysis/accu-nums/snapshot?draw_no=` | 분석 스냅샷 조회 |

## 웹 연동

- `apps/web/src/lib/accu-nums/api/core/url.ts`
- 구 URL 재시도: `apps/web/src/lib/accu-nums/api/core/fetchCore.ts`

## 환경·DB

- Postgres: `lotto_winners`, `accumulated_number_snapshots`
- 접속: `apps/api/README.md`의 `DATABASE_URL` 참고

## 실행·검증

```bash
npm run dev:api
npm run test -w api
```
