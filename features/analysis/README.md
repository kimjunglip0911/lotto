# Analysis Feature

JL 휠 기반 번호 생성/저장/중복 인사이트 분석을 담당합니다.

## 구성
- `page.tsx`: 분석 페이지 UI 엔트리
- `components/AnalysisController.tsx`: 생성/조회 컨트롤 UI
- `components/AnalysisResultList.tsx`: 세트 카드 리스트 렌더링
- `api/router.py`: `/api/analysis/*` 엔드포인트 (`generate/ai` 제외)
- `api/jl_service.py`: JL 시뮬레이션 로직 접근 레이어
- `api/queries.py`: 저장용 SQL
- `scripts/run_wheel_52.py`: 52회 테스트 실행 엔트리
- `scripts/당첨 이력.md`: 52회 테스트 결과 문서

## 스크립트 사용법

### 연구 분석 (`run_research.py`)
```
python -m features.analysis.scripts.run_research --mode boundary --target-set 2 14
python -m features.analysis.scripts.run_research --mode all
```

### 52회차 평가 (`run_wheel_52.py`)
```
python -m features.analysis.scripts.run_wheel_52 --seed 42 --independent-wheels --write-history "features/analysis/scripts/당첨 이력.md"
python -m features.analysis.scripts.run_wheel_52 --seed 42 --independent-wheels --refine-set 2 --refine-step 0.046
python -m features.analysis.scripts.run_wheel_52 --seed 42 --independent-wheels --refine-all --refine-step 0.5
```

### 다중 시드 검증 (`run_multi_seed.py`)
```
python -m features.analysis.scripts.run_multi_seed --seeds 20 --write-result "features/analysis/scripts/연구 분석 결과.md"
```

## 최근 반영 사항 (2026-03-26)
- **세트#15 재실행 완료 (`04-speed-research` 전체 플로우)**
  - 방향 1(Offset): `38 -> 31` 채택, 세트#15 5등 0→5 개선.
  - 방향 2(시작전략): `previous_draw`/`blended` 동률, `previous_draw` 유지.
  - 방향 3(구조패턴): 기존 `WHEEL_OFFSET_STEPS=[0,1,3,6,10,15]` 유지.
  - 필터 A/B: `--combo-filter` ON이 5등 +1, 평균 매치 수 0.8413→0.8529로 우세.
  - 다중 시드(1~20): 결과 변동 없음(표준편차 0.0).
- **기본 offset 반영**
  - `jl_service.py`의 `TWENTY_BASE_OFFSETS`에 세트#15 `31` 반영.
  - 최신 `당첨 이력.md`: 3등 1 / 4등 4 / 5등 36 / 합계 41 / 누적 34회.
- **offset 반영 버그 수정**
  - `jl_service.py`의 `_speed_from_offset()`이 세트 1~20에서 offset 인자를 무시하던 문제를 수정.
  - 이제 offset 변경이 실제 speed/생성 번호에 반영됨.
- **평가 지표 확장 (1등 목표 보조 지표)**
  - `run_wheel_52.py`에 평균 매치 수(`avg_match`)와 매치 수 분포(0~6)를 추가.
  - 보고서에 매치 수 분포 표를 출력해 "1등 근접도"를 함께 확인.
- **워크플로우 재설계 (`04-speed-research.md`)**
  - 3방향을 독립 축으로 재정의: offset 탐색 → 시작번호 전략 탐색 → 구조(`WHEEL_OFFSET_STEPS`) 탐색.
  - 방향 중 개선 발생 시 즉시 `best-so-far` 반영.
  - 하루 1회 플로우 완료 시점에 최선값을 반드시 기입하는 규칙 명시.
- **offset 중심 모델 전환 진행**
  - 외부 기준 파라미터를 `TWENTY_BASE_OFFSETS`로 추가.
  - 이력 문서(`당첨 이력.md`) 표를 `offset` 기준으로 출력.
  - 중복 재시도(jitter) 결과 동일성 유지를 위해 내부 speed 계산은 호환 유지.
- **세트#15 Offset 최적화 연구 수행**
  - `--refine-offset 15 --offset-full` 신규 옵션으로 offset 0~44 전체 탐색 → 전 후보 미당첨 → 방향 1 기각.
  - `--tune-reconcile --tune-unhit` + `--refine-set 15` → 방향 2 기각.
  - 현재값(offset 38, speed 108.93) 유지. 상세 기록은 `연구 분석 결과.md` 참조.
- **`run_wheel_52.py` offset 기반 탐색 기능 추가**
  - `--refine-offset N`: 세트#N의 offset을 정수 공간(0~44)에서 체계적으로 탐색.
  - `--offset-range R` / `--offset-full`: 국소(±R) 또는 전체 탐색 범위 지정.
  - 방향성 분석(+1 vs -1), 후보별 비교 테이블, 이웃 세트 충돌 거리, 채택 안내 출력.
- **조합 필터(방향 3) 구현**
  - `jl_service.py`: `_passes_combo_filter()` + `combo_filter` 파라미터 추가.
  - `run_wheel_52.py`: `--combo-filter` CLI 옵션 추가.
  - 합계(100~179) / 홀짝(올홀·올짝 제외) / 고저(올고·올저 제외) 필터 적용.

## 이전 반영 사항 (2026-03-25)
- **6휠 독립 speed 모델 도입** (방향 2)
  - `jl_service.py`: `WHEEL_OFFSET_STEPS`, `_derive_wheel_speeds()` 추가. 각 휠이 서로 다른 speed로 회전 → 별자리 제약 해소.
  - `generate_jl_wheel_sets(independent_wheels=True)` 옵션 추가.
  - `run_wheel_52.py`: `--independent-wheels` CLI 플래그 추가.
  - 결과: 3등 1회 출현, 4등 2→8, 5등 28→31, 합계 30→40 (33% 향상).
  - `TWENTY_BASE_SPEEDS` 20개를 독립 휠 모델에 맞춰 재최적화 반영.
- `scripts/run_research.py`
  - `--mode boundary` 추가: 경계 속도(Boundary Speed) 분석.
  - `--target-set N` 옵션 추가: 특정 세트만 분석.
- `.agents/workflows/04-speed-research.md` 생성: Speed 최적화 연구 워크플로우.

