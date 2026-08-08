/** 로또 6/45 본번호 전체 풀(1~45). 생성 시 직전 당첨 7개 등을 뺀 뒤 사용한다. */

export const FULL_LOTTO_POOL: readonly number[] = Object.freeze(
  Array.from({ length: 45 }, (_, i) => i + 1),
);
