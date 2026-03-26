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
- **offset 중심 모델 전환 진행**
  - 외부 기준 파라미터를 `TWENTY_BASE_OFFSETS`로 추가.
  - 이력 문서(`당첨 이력.md`) 표를 `offset` 기준으로 출력.
  - 중복 재시도(jitter) 결과 동일성 유지를 위해 내부 speed 계산은 호환 유지.

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

