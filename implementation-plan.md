# 구현 플랜: CDM 바이시안 기법 수치 조정

## 0. 설계 사전 검증 (02-guide 정밀 검증)

### 0.1 아키텍처·의존성 검토
| 항목 | 결과 | 비고 |
|------|------|------|
| 계층 규칙 | ✅ 유지 | 수정 범위는 `backend/domain/services/analysis/cdm/cdm_service.py` 한 곳. Domain이 Infrastructure(DB)에 의존하는 기존 패턴 유지. |
| API/스키마 변경 | ✅ 없음 | `unified_generator_service`는 `get_scores(draw_no: int) -> list[float]` 시그니처만 사용. 반환 길이 45, 정규화 합=1 유지 시 호출부 수정 불필요. |
| 의존성 충돌 | ✅ 없음 | 추가 패키지 없음. 기존 `uuid`, `get_connection`, `queries` 만 사용. |

### 0.2 예외 처리·엣지 케이스 검토
| 항목 | 위험 | 대응 |
|------|------|------|
| 당첨 데이터 없음 (`draw_no` 미만 0건) | `get_scores`: counts 전부 동일 → `total_score = 45`, 정규화 정상. `generate_cdm_sets`: 동일. | 추가 방어 불필요. |
| `total_score == 0` | 이론상 불가(최소 45개 번호×alpha). | 방어 코드 권장: `get_scores`에서 `total_score = sum(scores)` 후 `if total_score <= 0: return [1/45]*45` 등. |
| DB 연결 실패 | 현재 try/except 없음. | 스크립트/API 상위에서 처리. Domain 서비스는 기존처럼 예외 전파 가능. |
| 1210~1214 회차 미존재 | 분석 스크립트 실행 시 빈 결과. | 스크립트에서 "당첨번호 없음" 등 메시지 출력 후 종료. |

### 0.3 보안·성능
| 항목 | 결과 |
|------|------|
| SQL 인젝션 | ✅ 파라미터화 쿼리만 사용 (`?`, `(draw_no,)`). |
| N+1 | ✅ 회차당 1회 조회, 루프 내 추가 쿼리 없음. |

### 0.4 검증 결론
- **CRITICAL/HIGH 이슈 없음.** Step 진행 시 `get_scores`에 `total_score <= 0` 방어만 추가 권장.
- **Ready for Development**: 아래 Step 1~6 순서대로 구현 가능.

---

## 1. 목표 정의 (Define Success)

### 사용자 의도
- **작업**: CDM 바이시안 기법의 수치를 조정하여, 1210~1214 회차에 대해 추천 세트가 **5개 회차 전체에서 최소 5등(3개 이상 맞춤) 이상**이 나오도록 한다.
- **성공 기준**  
  - 1210, 1211, 1212, 1213, 1214 각 회차별로, 해당 회차에 저장된 CDM 관련 추천 세트 중 **최소 1세트**가 해당 회차 당첨번호와 **3개 이상 일치(5등 이상)** 한다.
- **제약**
  - 당첨번호 1210~1214는 이미 입력된 데이터를 사용한다.
  - 추천 세트 DB를 직접 확인·분석한 뒤 아이디어를 도출하고, 수정된 기법으로 DB를 업데이트한 후 당첨 등수로 검증한다.

### 용어 정리
- **5등**: 당첨 6개 번호 중 추천 세트와 **3개 일치** (보너스 불필요).
- **CDM 관련 추천 세트**: `method = 'CDM 바이시안'` 또는 통합 생성 시의 `'CDM 바이시안 베스트'` 등 CDM 점수를 사용해 만든 세트.
- **수치 조정**: CDM 내부 파라미터(예: Dirichlet prior `alpha`, 최근 회차 가중치 등) 변경.

---

## 2. 기술적 플랜 (High-level Plan)

### 2.1 현황 정리
- **당첨 데이터**: `lotto_winners` (draw_no, num1~num6, bonus_num).
- **추천 세트**: `lotto_drawings` (draw_no, method, num1~num6).  
  - 분석 화면에서 “분석 번호 생성” 시 `generate_optimal_20_sets(draw_no)` 호출 → 기법별 베스트 10세트 + 통합 최적 조합 10세트 저장.  
  - CDM은 10개 기법 중 하나로, **CDM 바이시안 베스트** 1세트가 포함됨.
  - CDM 전용 페이지에서는 `generate_cdm_sets(2, draw_no)`로 **CDM 바이시안** 2세트를 추가 생성할 수 있음.
- **CDM 로직** (`backend/domain/services/analysis/cdm/cdm_service.py`):
  - `draw_no` 미만 당첨 데이터로 1~45번 빈도 `n_j` 계산.
  - `W_j = alpha + n_j` (현재 `alpha = 1.0`).
  - 가중치 내림차순 정렬 후 상위 번호부터 6개씩 세트 구성 (첫 세트: 인덱스 0~5).
- **등수 판정**: 추천 세트 6개 번호와 당첨 6개 번호의 일치 개수로 판단 (3개 일치 = 5등).  
  - 참고: `frontend/src/features/home/components/SimulationStats.tsx` (matchCount 기준 1~5등·낙첨).

### 2.2 작업 단계

| 단계 | 내용 | 산출물 |
|------|------|--------|
| A | 1210~1214 회차 당첨번호 DB 조회 및 확인 | 당첨번호 목록(회차별 6개+보너스) |
| B | 1210~1214 회차의 추천 세트 DB 조회 (method에 CDM 포함된 행) | 회차별 CDM 관련 세트 목록 |
| C | 회차별로 추천 세트 ↔ 당첨번호 일치 개수 계산, 5등 이상 여부 확인 | 회차별 매칭 결과·5등 달성 여부 |
| D | 위 결과를 바탕으로 CDM 수치 조정 방안 도출 (alpha, 최근 회차 가중치 등) | 조정 계획 및 파라미터 후보 |
| E | `cdm_service.py` 수정 및 필요 시 설정값(상수/환경) 반영 | 수정된 CDM 로직 |
| F | 1210~1214 회차에 대해 추천 세트 재생성 및 DB 업데이트 (기존 해당 회차 CDM 세트 삭제 후 재저장 또는 전체 20세트 재생성) | 갱신된 `lotto_drawings` |
| G | 재계산된 추천 세트로 당첨번호와 다시 비교하여 5등 이상 달성 여부 확인 | 검증 결과 요약 |

### 2.3 수치 조정 방향 (아이디어)
- **DB 분석 후 결정**하되, 예시는 다음과 같다.
  - **alpha 조정**: `alpha` 감소 → 고빈도 번호에 더 집중 (과거 당첨과 겹칠 가능성 증가). `alpha` 증가 → 분포 평탄화로 다양한 번호 포함.
  - **최근 회차 가중치**: 직전 N회차(예: 10~30회) 당첨에 추가 가중치를 두어, 1210~1214 직전 트렌드를 더 반영.
  - **세트 구성 방식**: 상위 6개만 쓰지 않고, 상위 12~18개에서 여러 조합을 시도하거나, 확률적 샘플링으로 2세트 이상 구성해 3개 맞출 기회 확대.

**적용 결과 (03-develop 반영)**  
- `backend/domain/services/analysis/cdm/cdm_service.py`: `CDM_ALPHA = 0.2`, `RECENT_DRAW_N = 10`, `RECENT_DRAW_WEIGHT = 6.0` 적용 (재튜닝 후). `get_scores`에 `total_score <= 0` 방어 및 `_compute_counts`/`_weights_sorted` 공통화.  
- 재튜닝 시도: N=8~20, WEIGHT=4~7, ALPHA=0.15~0.3 구간에서 여러 조합 시험. 회차당 CDM 베스트 1세트 기준 최대 2개 일치까지 확인, 3개 이상 일치(5등)는 미달.  
- 1210~1214 회차 검증: 통합 생성기는 회차당 CDM 1세트만 사용하므로, 단일 세트로 5개 회차 모두에서 3개 이상 일치 달성은 미달. 추가 목표 달성을 위해 통합 생성기에서 CDM 2세트(상위 6개+다음 6개) 반영 검토 가능.

---

## 3. 정확한 수정 위치 (Target Locations)

### 3.1 반드시 수정할 파일
| 경로 | 수정 내용 |
|------|-----------|
| `backend/domain/services/analysis/cdm/cdm_service.py` | Dirichlet prior `alpha` 값 조정 또는 파라미터화, 필요 시 최근 회차 가중치 로직 추가, 세트 구성 방식(상위 6개 슬라이스 외 옵션) 검토 및 반영 |

### 3.2 분석·검증용 (선택 생성)
| 경로 | 용도 |
|------|------|
| `backend/scripts/analyze_cdm_draws_1210_1214.py` (신규) | 1210~1214 당첨번호·CDM 추천 세트 조회, 회차별 일치 개수·5등 여부 출력 (수치 조정 전/후 비교용) |
| `backend/scripts/refresh_cdm_drawings_1210_1214.py` (신규) | 1210~1214 회차에 대해 추천 세트 재생성 및 DB 업데이트 호출 (필요 시) |

- 스크립트는 `backend/infrastructure/persistence/database.py`, `queries.py`를 사용해 DB 접근.  
- 재생성 시 기존 `lotto_drawings` 중 해당 draw_no + CDM 관련 method만 삭제할지, 전체 20세트를 다시 만들지 정책 결정 후 구현.

### 3.3 참고만 하고 수정하지 않는 파일
- `backend/domain/services/analysis/unified_generator_service.py`: CDM은 `get_scores`만 사용하므로, `cdm_service.get_scores()` 반환 분포만 바뀌면 자동 반영됨.  
- `frontend/*`: 등수 표시 로직 변경 없음.  
- `backend/infrastructure/persistence/schema.sql`, `queries.py`: 테이블·쿼리 변경 없음 (필요 시 스크립트에서만 기존 쿼리 사용).

---

## 4. 플랜 문서 출력 (지시사항 요약)

### 다음 단계에서 수행할 작업
1. **DB 직접 확인**  
   - `lotto_winners`에서 draw_no 1210~1214 당첨번호 조회.  
   - `lotto_drawings`에서 draw_no 1210~1214 이면서 method에 'CDM'이 포함된 행 조회.
2. **매칭 분석**  
   - 위 추천 세트별로 해당 회차 당첨 6개와 일치 개수 계산, 5등(3개 이상) 달성 여부 표로 정리.
3. **수치 조정 계획 확정**  
   - 분석 결과를 바탕으로 `alpha`, 최근 회차 가중치, 세트 개수/구성 방식 중 어떤 것을 바꿀지 결정하고 `cdm_service.py` 수정 내용 구체화.
4. **구현**  
   - `backend/domain/services/analysis/cdm/cdm_service.py` 수정 후, 1210~1214 회차 추천 세트 재생성 및 DB 업데이트.
5. **검증**  
   - 재계산된 추천 세트로 1210~1214 당첨번호와 다시 비교하여, 회차별 최소 1세트 5등 이상 달성 여부 확인.

### 수정 대상 파일 요약
- **필수**: `backend/domain/services/analysis/cdm/cdm_service.py`  
- **선택**: `backend/scripts/analyze_cdm_draws_1210_1214.py`, `backend/scripts/refresh_cdm_drawings_1210_1214.py` (분석·갱신 자동화 시)

---

## 5. Step-by-Step 개발 가이드 (04-develop 수행 시 순서)

아래 Step을 **순서대로** 진행합니다. 각 Step 완료 후 다음 Step으로 진행하세요.

---

### [Step 1] DB 현황 분석 스크립트 작성 (선택, 권장)

**의도**: 1210~1214 회차 당첨번호·CDM 관련 추천 세트를 조회하고, 회차별 일치 개수·5등 달성 여부를 출력해 수치 조정 전 현황을 파악합니다.

**수정 파일**: `backend/scripts/analyze_cdm_draws_1210_1214.py` (신규)

**제약·지시**:
- `backend` 루트 또는 `backend/scripts` 디렉터리가 존재하는지 확인 후, 없으면 `scripts` 폴더 생성.
- 스크립트 실행 시 working directory는 `backend`로 가정. `from infrastructure.persistence.database import get_connection`, `from infrastructure.persistence import queries` 사용 시 `sys.path`에 `backend`를 넣거나 `python -m`으로 실행하도록 안내.
- SQL은 파라미터화만 사용. `lotto_winners`에서 `draw_no IN (1210,1211,1212,1213,1214)` 조회.
- `lotto_drawings`에서 동일 `draw_no` 이며 `method LIKE '%CDM%'` 또는 `method = 'CDM 바이시안 베스트'` 인 행 조회.
- 회차별로: 당첨 6개 집합, 각 추천 세트의 6개와 일치 개수 계산 → 3개 이상이면 5등 달성. 결과를 표 형태로 출력(회차, method, num1~num6, 일치개수, 5등여부).
- 당첨번호가 없는 회차는 "당첨번호 없음" 출력 후 해당 회차 스킵.

**완료 기준**: `cd backend && python scripts/analyze_cdm_draws_1210_1214.py` 실행 시 1210~1214 회차별 당첨번호·CDM 세트·일치 개수·5등 여부가 콘솔에 출력됨.

---

### [Step 2] CDM 서비스 수치 조정 (alpha 및 로직)

**의도**: `cdm_service.py`에서 Dirichlet prior `alpha` 값을 조정하고, 필요 시 최근 회차 가중치를 반영하여 1210~1214 당첨과 3개 이상 겹치는 세트가 나올 가능성을 높입니다.

**수정 파일**: `backend/domain/services/analysis/cdm/cdm_service.py`

**제약·지시**:
- **반드시 유지**: `get_scores(draw_no: int) -> list[float]` 시그니처 및 반환 길이 45, 합=1.0 (정규화). `generate_cdm_sets(count: int, draw_no: int)` 시그니처 및 반환 형태 `list[dict]` (num1~num6, method, draw_no, group_id 등).
- **alpha**: 상수 `1.0`을 모듈 상단 또는 함수 인자 기본값으로 두고, **조정 가능한 하나의 값**으로 통일. 예: `CDM_ALPHA = 0.5` (고빈도 집중) 또는 `1.0` 유지. `generate_cdm_sets`와 `get_scores` **둘 다** 동일한 alpha 사용.
- **최근 회차 가중치 (선택)**: 과거 당첨 조회 시 `draw_no < ?` 결과에 대해, 최근 N회차(예: 20회)에 가중치(예: 2.0)를 곱해 counts에 반영. 구현 시 N과 배율은 상수로 두고, `get_scores`와 `generate_cdm_sets`에서 **동일한 counts/weights 계산**을 공유하도록 할 것(중복 제거 권장).
- **get_scores 방어**: `total_score = sum(scores)` 계산 후 `if total_score <= 0: return [1/45.0] * 45` 처리 추가.
- **세트 구성**: 현재처럼 가중치 내림차순 상위 번호부터 6개씩 슬라이스 유지. 다른 방식(상위 12개에서 조합 등)은 Step 2 완료 후 검증 결과에 따라 Step 2 보완으로 진행.

**완료 기준**: alpha(및 선택적 최근 회차 가중치) 반영 후, `get_scores(d)` 호출 시 45개 float 리스트, 합 1.0 반환. `generate_cdm_sets(2, d)` 호출 시 2개 세트가 DB에 저장되고 동일 로직으로 생성됨.

---

### [Step 3] 1210~1214 회차 추천 세트 재생성 및 DB 반영

**의도**: 수정된 CDM을 반영해 1210~1214 회차에 대한 추천 세트를 다시 만들고 DB를 갱신합니다.

**수정 파일**: 없음(기존 API 사용) 또는 `backend/scripts/refresh_cdm_drawings_1210_1214.py` (신규, 선택)

**제약·지시**:
- **방법 A (권장)**: 프론트 분석 화면에서 회차 1210 선택 후 "분석 번호 생성" 실행 → 1211, 1212, 1213, 1214 반복. 또는 `POST /api/analysis/generate-and-save`에 `{"draw_no": 1210}` ~ `{"draw_no": 1214}` 호출.  
  - 참고: 해당 API는 `generate_optimal_20_sets(draw_no)`를 호출하며, 이때 **해당 draw_no에 기존 저장된 20세트를 삭제하는 로직이 없음**. 따라서 기존 구현이 "추가 삽입"이면, 중복 방지를 위해 **방법 B** 또는 기존 `DELETE FROM lotto_drawings WHERE draw_no = ?` 실행 후 재호출이 필요할 수 있음.
- **방법 B**: 스크립트 `refresh_cdm_drawings_1210_1214.py`에서 `queries.DELETE_DRAWINGS_BY_NO`로 각 draw_no(1210~1214) 삭제 후 `generate_optimal_20_sets(draw_no)` 호출. 스크립트는 `backend`를 PYTHONPATH에 두고 실행.

**완료 기준**: 1210~1214 각 회차에 대해 `lotto_drawings`에 해당 draw_no의 추천 세트가 수정된 CDM 로직으로 저장됨(기법별 베스트 10세트 + 통합 최적 10세트).

---

### [Step 4] 당첨 등수 검증

**의도**: 재생성된 추천 세트를 1210~1214 당첨번호와 비교해, 회차별로 최소 1세트가 5등(3개 이상 일치) 이상인지 확인합니다.

**수정 파일**: 없음. Step 1의 분석 스크립트를 재실행하거나, 동일 로직(당첨 6개 vs 추천 6개 일치 개수, 3 이상이면 5등)으로 결과만 다시 출력.

**제약·지시**:
- Step 1 스크립트를 다시 실행하거나, 수동으로 DB에서 해당 회차 추천 세트·당첨번호를 읽어 일치 개수 계산.
- 회차별로 "CDM 바이시안 베스트" 또는 "CDM 바이시안" 중 최소 1세트가 3개 이상 일치하면 해당 회차 목표 달성.

**완료 기준**: 1210, 1211, 1212, 1213, 1214 모두에서 최소 1세트 5등 이상이면 성공. 미달 회차가 있으면 Step 2로 돌아가 alpha/가중치/세트 구성 재조정.

---

### [Step 5] (선택) README 및 문서 반영

**의도**: 변경된 CDM 파라미터(alpha, 최근 회차 가중치 유무)를 해당 기능 README에 기록합니다.

**수정 파일**: `backend/domain/services/analysis/cdm/` 하위 README가 있으면 해당 파일, 없으면 `frontend/src/features/analysis/README.md` 또는 `implementation-plan.md` 내 "수치 조정 방향" 절에 최종 적용값 요약.

**완료 기준**: 이후 유지보수 시 참고할 수 있도록 적용한 alpha(및 선택 파라미터) 값이 문서에 명시됨.

---

### Step 의존성 요약

```
Step 1 (분석 스크립트) ──┐
                        ├──> Step 2 (cdm_service 수치 조정) ──> Step 3 (재생성·DB) ──> Step 4 (검증)
                        │                                              │
                        └──> Step 4에서 재실행 가능 ◄──────────────────┘
```

---

*이 문서는 01-plan·02-guide 단계를 거친 산출물이며, 04-develop 시 위 Step 1~5 순서대로 구현·검증합니다.*
