# -*- coding: utf-8 -*-
"""
융합 기법: 1215회 포함 최신 52회(1164~1215)에 대해 회차당 20세트 생성.
실행: backend 디렉터리에서 python -m scripts.generate_fusion_52
"""
import sys
import uuid
from pathlib import Path

sys.dont_write_bytecode = True
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries
from domain.services.analysis.fusion_service import generate_20_sets

DRAW_NOS = tuple(range(1164, 1216))
METHOD_NAME = "융합(52회)"


def main() -> None:
    for i, draw_no in enumerate(DRAW_NOS):
        sets_20 = generate_20_sets(draw_no)
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.DELETE_DRAWINGS_BY_NO_AND_METHOD, (draw_no, METHOD_NAME))
        for combo in sets_20:
            nums = sorted(combo)
            cursor.execute(
                queries.INSERT_DRAWING,
                (
                    f"group_fusion_{uuid.uuid4().hex[:8]}",
                    nums[0], nums[1], nums[2], nums[3], nums[4], nums[5],
                    0, 0, METHOD_NAME, draw_no,
                ),
            )
        conn.commit()
        conn.close()
        if (i + 1) % 10 == 0 or i == 0 or i == len(DRAW_NOS) - 1:
            print(f"회차 {draw_no}: 융합 20세트 저장 완료")
    print("52회 융합 20세트 생성 완료. analyze_fusion_52 로 검증하세요.")


if __name__ == "__main__":
    main()
