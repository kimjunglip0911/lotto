"""
1210~1214 회차에 대해 기존 추천 세트를 삭제한 뒤 수정된 CDM을 포함한 20세트를 재생성합니다.
실행: backend 디렉터리에서
  python -m scripts.refresh_cdm_drawings_1210_1214
"""
import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries
from domain.services.analysis.unified_generator_service import generate_optimal_20_sets

DRAW_NOS = (1210, 1211, 1212, 1213, 1214)


def main() -> None:
    for draw_no in DRAW_NOS:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.DELETE_DRAWINGS_BY_NO, (draw_no,))
        deleted = cursor.rowcount
        conn.commit()
        conn.close()
        print(f"회차 {draw_no}: 기존 추천 세트 {deleted}건 삭제")

        saved = generate_optimal_20_sets(draw_no)
        print(f"회차 {draw_no}: 추천 세트 {len(saved)}건 재생성 완료")

    print("1210~1214 회차 재생성 모두 완료. Step 4에서 분석 스크립트로 검증하세요.")


if __name__ == "__main__":
    main()
