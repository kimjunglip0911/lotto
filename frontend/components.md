# Component Registry

This file tracks all custom React components in the project, enforcing the UI -> Common -> Page-Specific architectural hierarchy specified in `rules1.md`.

## 1. UI Components (`src/components/ui/`)
가장 작은 단위의 원자적(Atomic) 컴포넌트입니다. 상태를 갖지 않으며 재사용성을 극대화합니다.
- `LotteryBall.tsx`: 로또 번호 하나를 렌더링하는 컴포넌트 (`isBonus` props 지원)

## 2. Common Components (`src/components/common/`)
여러 페이지 또는 도메인에서 공통으로 사용되는 레이아웃 및 복합 컴포넌트입니다.
- `Header.tsx`: 글로벌 상단 네비게이션바
- `BottomNav.tsx`: 글로벌 하단 앱 네비게이션바

## 3. Page-Specific Components (`src/components/page-specific/`)
특정 라우트나 도메인(예: Home)에 종속된 비즈니스 응집도 높은 컴포넌트입니다.

### Home (`src/components/page-specific/home/`)
- `LotteryCard.tsx`: 단일 추천 로또 세트(6+1)를 렌더링하는 카드 컴포넌트
- `LotteryGrid.tsx`: 10개의 `LotteryCard` 표출 및 세트 갱신 기능(Genearte)을 담은 컨테이너
- `AlgorithmInfo.tsx`: 난수 생성 알고리즘 설명 영역
- `WinningStats.tsx`: 당첨 통계 정보 영역 (추후 ApexCharts 연동 전제)
- `EliteMembers.tsx`: 프리미엄 사용자 후기 영역
