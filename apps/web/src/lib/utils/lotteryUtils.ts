/** 번호 구간별 볼 배경색: 1~9 / 10~19 / 20~29 / 30~39 / 40~45 */
export const getBallColor = (num: number): string => {
    if (num <= 9) return "bg-[#f29422]"; // 주황
    if (num <= 19) return "bg-[#3dabee]"; // 파랑
    if (num <= 29) return "bg-[#e9432f]"; // 빨강
    if (num <= 39) return "bg-[#a1a1a1]"; // 회색
    return "bg-[#6cc04a]"; // 녹색
};
