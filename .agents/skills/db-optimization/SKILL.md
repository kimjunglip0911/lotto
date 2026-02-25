---
name: db-optimization
description: DB 수정 권한이 없는 환경에서의 SQL 조회 성능 최적화 가이드라인 (SELECT *, 좌변 가공 금지, UNION ALL 활용 등)
---

# DB 쿼리 최적화 스킬 (Read-Only SQL Optimization)

이 스킬은 **테이블 생성/수정/인덱스 권한이 없는 환경**에서 오직 **SQL 쿼리 수정(Rewrite)**만으로 성능을 개선할 때 따르는 지침입니다.

## 1. SELECT * 절대 금지
*   **지침**: 필요한 컬럼만 명시적으로 나열하세요.
*   **Why**: 불필요한 I/O, 메모리 낭비, 커버링 인덱스 기회 상실.
*   **Check**: 쿼리에 `SELECT *`가 포함되어 있는지 확인.

## 2. 좌변 가공 금지 (Index-Friendly)
*   **지침**: `WHERE` 절의 컬럼(좌변)에 함수나 연산을 적용하지 마세요.
*   **Bad**: `WHERE UPPER(user_id) = 'ADMIN'` (인덱스 미사용)
*   **Good**: `WHERE user_id = 'ADMIN'` (우변을 맞춰서 비교)
*   **Good**: `WHERE date_col BETWEEN ...` (날짜 변환 대신 범위 검색 사용)

## 3. OR 대신 UNION ALL
*   **지침**: 서로 다른 인덱스를 타야 하는 조건이 `OR`로 묶인 경우, `UNION ALL`로 분리하세요.
*   **Why**: 최적화기가 효율적인 경로를 찾기 어렵고 Full Scan 위험이 있음.
*   **Note**: 중복 데이터가 확실히 없다면 `UNION`(정렬 발생)보다 `UNION ALL`이 빠릅니다.

## 4. 서브쿼리 vs 조인
*   **지침**: SELECT 절의 스칼라 서브쿼리(N+1 문제)는 가급적 `JOIN`으로 변경하세요.
*   **Check**: 결과 행마다 반복 실행되는 서브쿼리가 있는지 확인.
*   **Anti-Pattern**: 조인 조건 누락으로 인한 카테시안 곱(Cartesian Product) 주의.

## 5. 실행 계획 기본 점검
*   **Bottleneck 탐색**: 실행 계획에서 **Cost**가 가장 높거나 **Rows(Cardinality)**가 예상보다 과도하게 큰 단계를 확인하세요.
*   **Access Method**:
    *   `TABLE ACCESS FULL`: 데이터가 많은데 풀스캔이면 비효율.
    *   `INDEX RANGE SCAN`: 일반적인 권장 방식.
