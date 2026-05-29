# home API (`/api/drawings`)

## 목적

추첨 번호(`lotto_drawings`) 조회·삭제와 당첨번호(`lotto_winners`) 조회·저장을 담당합니다.

## 폴더

```text
home/
├── home.module.ts
├── controller/drawings.controller.ts
├── service/drawings.service.ts
└── queries/
    ├── draw.queries.ts
    └── win.queries.ts
```

## 엔드포인트

| 메서드 | 경로 | 설명 |
|:---|:---|:---|
| GET | `/api/drawings` | 전체 추첨 목록 |
| DELETE | `/api/drawings/all` | 추첨 데이터 전체 삭제 |
| GET | `/api/drawings/draw-numbers` | 저장된 회차 번호 목록 |
| GET | `/api/drawings/by-no?draw_no=` | 회차별 추첨 목록 |
| GET | `/api/drawings/winning-by-no?draw_no=` | 회차별 당첨번호 조회 |
| POST | `/api/drawings/save-winning` | 당첨번호 저장 |

## 웹 연동

- 당첨 조회·저장: `apps/web/src/app/home/constants/apiPath.ts` (`winning-by-no`, `save-winning`)
- 회차 목록(분석): `apps/web/src/app/analysis/final-pick` → `draw-numbers`
- 추천 세트 조회는 **`/api/recommend/drawings`** (`recommend` 모듈)를 사용합니다.

## 삭제된 API

- `GET /api/drawings/recommend` — 미사용으로 제거. 대체: `GET /api/recommend/drawings?draw_no=`

## 환경·DB

- SQLite 테이블: `lotto_drawings`, `lotto_winners`
- DB 경로: 루트 `apps/api/README.md`의 `LOTTO_DB_PATH` 참고

## 실행·검증

```bash
npm run dev:api
npm run test -w api
```
