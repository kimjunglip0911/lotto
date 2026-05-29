import type { ReactNode } from 'react';

/**
 * 홈 화면에서 회차·당첨 입력·통계·세트 목록을 감싸는 큰 카드 박스입니다.
 *
 * 하는 일
 * - 둥근 테두리, 그림자, 상단 빛 번짐(blur) 같은 꾸밈만 담당합니다.
 * - 안쪽에 무엇을 넣을지는 정하지 않고, 부모가 넘긴 내용(children)만 그대로 보여 줍니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 화면에 그릴 자식 요소(children) 하나
 * - 돌려줌: 꾸밈이 적용된 카드 안에 children을 담은 레이아웃
 *
 * 역할 나눔
 * - 무엇을 어떤 순서로 넣을지: `ui/HomeMain.tsx`
 * - 회차·입력·통계·목록 내용: `GridControls`, `RankStats`, `SetList` 등
 *
 * 실패·주의
 * - 데이터 조회·저장 실패와는 무관합니다. 자식 컴포넌트가 각각 안내를 표시합니다.
 */

interface HomeCardProps {
  children: ReactNode;
}

export const HomeCard = ({ children }: HomeCardProps) => (
  <div className="bg-card border border-card-border rounded-3xl p-4 sm:p-6 flex flex-col relative shadow-2xl overflow-visible">
    <div className="absolute top-0 inset-x-0 h-40 bg-primary/20 blur-[60px] pointer-events-none rounded-t-3xl" />
    {children}
  </div>
);
