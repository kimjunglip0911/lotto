# Home Feature

홈 화면에서 회차별 분석 세트 조회와 수동 당첨번호 입력 기반 시뮬레이션을 담당합니다.

## 구성
- `page.tsx`: 홈 페이지 UI 엔트리
- `components/LotteryGrid.tsx`: 홈 분석 카드 영역 오케스트레이션
- `components/LotteryGridControls.tsx`: 회차 선택 및 수동 당첨번호 입력 UI
- `components/LotterySetList.tsx`: 세트 빈 상태/그리드 렌더링 UI
- `components/hooks/useLotteryGridData.ts`: 회차 목록/세트 조회 및 회차 선택 상태 관리
- `components/hooks/useWinningNumbersInput.ts`: 당첨번호/보너스 입력 상태와 파싱 핸들러 관리
- `api/router.py`: `/api/drawings/*` 엔드포인트
- `api/queries.py`: drawings 조회/삭제 관련 SQL

