# Analysis Feature 도메인

로또 번호 생성기 프로젝트 중, "분석 및 순수 난수 번호 추첨" 기능을 담당하는 도메인 폴더입니다.
기존의 복잡한 통계 및 머신러닝 모듈이 제거되고, 기본 번호 생성기 기능만 남아있습니다. 추후 고도화된 분석 기능이 확장될 수 있는 빈 공간(Slot) 역할을 합니다.

## 컴포넌트 목록
- `NumberGenerator.tsx`: 백엔드의 순수 난수 생성 API(`/api/analysis/generate/ai`)를 호출하여 20세트의 임의 번호를 가져옵니다.
- `DrawGrid.tsx`: 받아온 로또 번호 세트 목록을 `LotteryCard`를 이용해 그리드 형태로 출력합니다.

## API 의존성
- `GET /api/analysis/generate/ai`: 20세트의 난수 번호를 가져옵니다.
