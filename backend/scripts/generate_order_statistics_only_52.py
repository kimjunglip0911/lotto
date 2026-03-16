# -*- coding: utf-8 -*-
"""
순서 통계량 전용: 1215회 포함 최신 52회(1164~1215)에 대해 회차당 1세트만 생성합니다.
20세트 통합 생성보다 빠르게 순서 통계량 튜닝·분석을 반복할 수 있습니다.

실행: backend 디렉터리에서
  python -m scripts.generate_order_statistics_only_52
"""
import sys
import uuid
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries
from domain.services.analysis.order_statistics_service import get_scores

DRAW_NOS = tuple(range(1164, 1216))  # 1215 포함 최신 52회
METHOD_NAME = "순서 통계량 베스트"


def main() -> None:
    for i, draw_no in enumerate(DRAW_NOS):
        scores = get_scores(draw_no)
        num_score_list = [(j + 1, scores[j]) for j in range(45)]
        num_score_list.sort(key=lambda x: x[1], reverse=True)
        best_nums = sorted([num_score_list[k][0] for k in range(6)])

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.DELETE_DRAWINGS_BY_NO_AND_METHOD, (draw_no, METHOD_NAME))
        cursor.execute(
            queries.INSERT_DRAWING,
            (
                f"group_os_only_{uuid.uuid4().hex[:8]}",
                best_nums[0],
                best_nums[1],
                best_nums[2],
                best_nums[3],
                best_nums[4],
                best_nums[5],
                0,
                0,
                METHOD_NAME,
                draw_no,
            ),
        )
        conn.commit()
        conn.close()
        if (i + 1) % 10 == 0 or i == 0 or i == len(DRAW_NOS) - 1:
            print(f"회차 {draw_no}: 순서 통계량 베스트 1세트 저장 완료")
    print("52회 순서 통계량 전용 생성 완료. python -m scripts.analyze_order_statistics_52 로 검증하세요.")


if __name__ == "__main__":
    main()
