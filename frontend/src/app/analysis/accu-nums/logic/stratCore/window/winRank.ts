/**
 * 윈도별 백테스트 점수(맞춘 비율·평균 적중)와, 그 점수로 “어느 기간을 쓸지” 고르는 함수를 이 파일에서 한데 모아 보낸다.
 * 추천 화면·누적 분석이 같은 진입 경로를 쓴다.
 */

export { toAtLeastOneRate, toAvgHits } from './winRankMetrics';
export { pickTopWindowsByStrategy } from './winRankPickTop';
export { pickAdaptiveWindowsByStrategy } from './winRankPickAdpt';
