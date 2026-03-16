# -*- coding: utf-8 -*-
"""
1215회 포함 최신 52회(1164~1215)에 대해 기존 추천 세트를 삭제한 뒤 통합 20세트를 재생성합니다.
실행: backend 디렉터리에서
  python -m scripts.generate_drawings_52
"""
import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries
from domain.services.analysis.unified_generator_service import generate_optimal_20_sets

# 1215회 포함 최신 52회
DRAW_NOS = tuple(range(1164, 1216))  # 1164, 1165, ..., 1215


def main() -> None:
    for i, draw_no in enumerate(DRAW_NOS):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.DELETE_DRAWINGS_BY_NO, (draw_no,))
        deleted = cursor.rowcount
        conn.commit()
        conn.close()
        saved = generate_optimal_20_sets(draw_no)
        if (i + 1) % 10 == 0 or i == 0 or i == len(DRAW_NOS) - 1:
            print(f"회차 {draw_no}: 기존 {deleted}건 삭제, 추천 세트 {len(saved)}건 재생성 완료")
    print("52회(1164~1215) 재생성 모두 완료. analyze_order_statistics_52 로 검증하세요.")


if __name__ == "__main__":
    main()
