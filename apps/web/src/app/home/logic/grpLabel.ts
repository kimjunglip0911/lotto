/** 홈 묶음 버튼·헤더 문구. 물결표 없이 N부터 M세트 */

export const grpLabel = (index: number, size: number): string => {
  const start = index * size + 1;
  const end = (index + 1) * size;
  return `${start}부터 ${end}세트`;
};
