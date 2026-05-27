export const parseSelDraw = (selectedDraw: string): number | null => {
  const drawNo = Number(selectedDraw);
  if (!Number.isInteger(drawNo) || drawNo < 1) return null;
  return drawNo;
};
