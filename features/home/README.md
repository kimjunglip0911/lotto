# Home Feature

홈 화면에서 회차별 분석 세트 조회와 당첨번호 자동 표시(수동 수정 가능) 기반 시뮬레이션을 담당합니다.

## 구성
- `page.tsx`: 홈 페이지 UI 엔트리
- `components/LotteryGrid.tsx`: 홈 분석 카드 영역 오케스트레이션
- `components/LotteryGridControls.tsx`: 회차 선택 및 수동 당첨번호 입력 UI
- `components/LotterySetList.tsx`: 세트 빈 상태/그리드 렌더링 UI
- `components/hooks/useLotteryGridData.ts`: 회차 목록/세트 조회 + 회차별 1등 당첨번호 조회 상태 관리
- `components/hooks/useWinningNumbersInput.ts`: 당첨번호/보너스 입력 상태, 파싱 핸들러, 외부 데이터 자동 채움 처리
- `api/router.py`: `/api/drawings/*` 엔드포인트
- `api/queries.py`: drawings 조회/삭제 관련 SQL

## 동작 요약
- 회차 선택 시 `GET /api/drawings/winning-by-no?draw_no=...`를 호출해 `lotto_winners`의 1등 당첨번호(6개+보너스)를 입력칸에 자동 반영합니다.
- 자동 반영 후에도 사용자가 입력칸 값을 직접 수정할 수 있습니다.
- 선택 회차에 당첨번호 데이터가 없으면 입력칸은 빈값으로 초기화됩니다.

