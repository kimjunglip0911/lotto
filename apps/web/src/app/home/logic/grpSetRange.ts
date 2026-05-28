/**
 * 10세트 묶음 PNG 파일 이름에 쓸 세트 번호 범위를 계산합니다.
 *
 * 하는 일
 * - 그룹 순서와 묶음 크기로 「시작 세트 번호」「끝 세트 번호」를 구합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 그룹 인덱스(0부터), 그룹당 세트 수(보통 10), 이번 그룹의 실제 세트 개수
 * - 돌려줌: start, end (1부터 세는 세트 번호)
 */

export const grpSetRange = (groupIndex: number, groupSize: number, count: number) => ({
  start: groupIndex * groupSize + 1,
  end: groupIndex * groupSize + count,
});
