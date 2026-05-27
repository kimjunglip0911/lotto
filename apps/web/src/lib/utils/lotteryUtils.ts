export const getBallColor = (num: number): string => {
    if (num <= 10) return "bg-[#f29422]"; // 주황
    if (num <= 20) return "bg-[#3dabee]"; // 파랑
    if (num <= 30) return "bg-[#e9432f]"; // 빨강
    if (num <= 40) return "bg-[#a1a1a1]"; // 회색
    return "bg-[#6cc04a]"; // 녹색 (41-45)
};
