# Home Page Components

메인 페이지 전용 컴포넌트 모음입니다.

## 수정 내역
- **2026-02-25**: 
  - `LotteryGrid.tsx` 최대 컨테이너 너비를 1920px로 확장하고 복권 번호 세트를 5개씩 2줄(5x2)로 배치.
  - `LotteryGrid.tsx` 로또 번호 생성 버튼의 텍스트를 "신규 로또 번호 세트 생성"으로, 아이콘을 주사위 모양(`casino`)으로 교체.
  - 번호 10세트(총 70개 숫자) 무작위 생성 로직 추가.
  - 번호 생성 시 빈 공부터 시작하여 순차적으로 숫자가 채워지는 애니메이션(Interval 30ms) 구현 및 생성 중 주사위 롤링(spin) 피드백 적용.
  - `LotteryBall.tsx` `num`이 0인 경우 빈 공 형태(번호 미출력)로 처리하는 렌더링 로직 추가.
  - `LotteryGrid.tsx` 애니메이션 Interval 실행 도중 발생하는 `activeSet.numbers is not iterable` 런타임 에러 해결 (인덱스 범위 초과 접근에 대한 Guard Clause 추가).
  - **[Bug Fix]** `LotteryGrid.tsx` 상태 업데이트 최적화: `setInterval` 내 React Batch Update 지연 실행으로 인해 `currentSetIndex`가 로깅 시점에 이미 상향 조정되어 터지는 Closure Scope 참조 문제를 `const` 블록 변수 캡처 기법으로 완벽히 해결.
  - **[Update]** `LotteryGrid.tsx` 자동 추첨 제거(마운트 시점 생성 안 함) 및 애니메이션 속도 하향 조절(30ms -> 80ms).
