# Home Feature

홈 화면에서 회차별 분석 세트 조회와 수동 당첨번호 입력 기반 시뮬레이션을 담당합니다.

## 구성
- `page.tsx`: 홈 페이지 UI 엔트리
- `components/LotteryGrid.tsx`: 회차 선택, 수동 당첨번호 입력, 세트 그리드 렌더링
- `api/router.py`: `/api/drawings/*` 엔드포인트
- `api/queries.py`: drawings 조회/삭제 관련 SQL

