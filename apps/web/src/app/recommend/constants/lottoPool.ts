/** 로또 6/45 본번호 전체 풀(1~45). 추천 세트 생성 시 항상 이 목록을 사용한다. */

export const FULL_LOTTO_POOL: readonly number[] = Object.freeze(
  Array.from({ length: 45 }, (_, i) => i + 1),
);
