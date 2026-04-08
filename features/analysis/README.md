# Analysis Feature

JL 휠 기반 번호 생성/저장/중복 인사이트 분석을 담당합니다.

## 구성

### UI
- `page.tsx`: 분석 페이지 UI 엔트리
- `components/AnalysisController.tsx`: 생성/조회 컨트롤 UI
- `components/AnalysisResultList.tsx`: 세트 카드 리스트 렌더링

### 도메인
- `domain/lotto_rank.py`: 로또 6/45 등수 판정 (`rank_lotto_ticket`)

### API
- `api/router.py`: `/api/analysis/*` 엔드포인트
- `api/queries.py`: 저장용 SQL

### JL 휠 엔진 (`api/jl_service/`)

914줄 단일 파일에서 역할별 7개 모듈로 분리:

| 모듈 | 역할 |
|------|------|
| `config.py` | 상수·프로파일·오프셋 (튜닝 시 이 파일만 수정) |
| `physics.py` | 휠 물리 시뮬레이션 + 6휠 드로우 |
| `start_numbers.py` | 시작번호 전략 (previous/frequency/blended) |
| `dedup.py` | 중복 방지 (사전 다양화 + 사후 빈도 교체) |
| `generator.py` | 20세트 생성 파이프라인 |
| `analysis.py` | 당첨 비교·중복 인사이트 분석 |
| `search.py` | 파라미터 역탐색 (번호 → speed/decel) |

> import 경로는 기존과 동일: `from features.analysis.api.jl_service import X`

### 연구 스크립트 (`scripts/`)
- `run_00_cumulative_winners.py`: 누적 당첨 번호 집계(1~N) 후 상위 5개/하위 5개 번호를 산출
- `run_01_pick_offset_start.py`: 직전회차(P)와 현재회차(C) 1등 번호를 같은 위치로 비교해 6개 `오프셋칸수`를 계산하고 추천 번호를 생성. **황금비/시작번호 조합 탐색 미사용**, 시작번호는 DB 순서(num1~num6) 고정. 치환 전 추천번호에 중복이 생기면 `현재회차등수_치환전`은 `null`로 기록하고 스크립트는 계속 진행한다.
- `run_02_three_year_single_set.py`: pick의 6개 `오프셋칸수`로 최신 52회차 단일 세트 평가 → `당첨 이력.md` 갱신. 각 목표 회차 T마다 누적 집계는 `1~(T-1)`로 재계산하며, **기준회차(C)에서의 1등 재현 건은 표의 `회차(등수)`에서 제외**한다. (영문 `offset_steps` 레거시 키도 호환)
- 메인 서비스(`jl_service/generator.py`)는 프로젝트 루트 `pick.json`이 있으면 **20세트 전체 생성에** `오프셋칸수`를 자동 반영한다(영문 `offset_steps`도 호환, 1번 스크립트 실행 결과 연동).
- `jl_wheel_batch_eval.py`: 가변 회차 배치 평가·이력 포맷·config 반영 헬퍼(`parse_dangcheom_history_table`, `aggregate_dangcheom_merged_rows` 등)
- `당첨 이력.md`: 단일 세트 최신 52회차 평가 결과(2번 스크립트가 갱신)
- `연구 분석 결과.md`: 과거 연구 메모(레거시 `run_research`/`run_multi_seed`는 제거됨)

## 스크립트 사용법

### 1등 offset 선정 워크플로 (요약)
```
python -m features.analysis.scripts.run_00_cumulative_winners --up-to-draw 1218 --top-n 5 --bottom-n 5
python -m features.analysis.scripts.run_01_pick_offset_start --prev-draw 1217 --current-draw 1218 --set-index 1 --write-pick pick.json
python -m features.analysis.scripts.run_02_three_year_single_set --pick-json pick.json --write-history "features/analysis/scripts/당첨 이력.md"
```
자세한 절차는 `.agents/workflows/01.1등당첨.md` 참고.

## API

| HTTP | 경로 | 설명 |
|------|------|------|
| GET | `/api/analysis/generate/wheel?count=20&draw_no=` | JL 휠 생성 (미저장) |
| POST | `/api/analysis/generate-and-save` | JL 휠 20세트 DB 저장 |
| GET | `/api/analysis/draw-duplicate-insight?draw_no=&count=` | 교체 전/후 중복 분석 |

> 로또는 난수 추첨이므로 당첨 보장 불가. 참고·실험용입니다.

## UI 스타일링 규칙
- 분석 UI 컴포넌트(`AnalysisController`, `AnalysisResultList`)는 `features/analysis/components/*`에 위치하며 Tailwind 유틸리티를 직접 사용합니다.
- 홈/분석 공통으로 `features/*` 클래스가 빌드되려면 `frontend/src/app/globals.css`의 source 선언이 유지되어야 합니다.
  - `@source "../../../features/**/*.{ts,tsx}";`
- 특히 `휠 시뮬레이션 20세트 (미저장)` 버튼을 포함한 CTA는 `text-primary`, `bg-card`, `border-card-border` 기반 토큰 체계를 따릅니다.
