import random
from typing import Dict, List, Optional, Tuple


def load_jl_service() -> Tuple:
    try:
        from features.analysis.api.jl_service import (  # type: ignore
            analyze_draw_duplicate_sets,
            generate_jl_wheel_sets,
            generate_wheel_sets,
        )

        return analyze_draw_duplicate_sets, generate_jl_wheel_sets, generate_wheel_sets
    except Exception:
        # features 모듈이 없는 환경에서도 추천 API를 계속 사용할 수 있도록 fallback 생성 로직을 제공합니다.
        def _fallback_generate_wheel_sets(
            count: int = 20,
            start_index: int = 0,
            draw_no: Optional[int] = None,
        ) -> List[dict]:
            del start_index
            del draw_no

            rows: List[dict] = []
            for _ in range(max(1, count)):
                numbers = sorted(random.sample(range(1, 46), 6))
                rows.append(
                    {
                        "num1": numbers[0],
                        "num2": numbers[1],
                        "num3": numbers[2],
                        "num4": numbers[3],
                        "num5": numbers[4],
                        "num6": numbers[5],
                    }
                )
            return rows

        def _fallback_generate_jl_wheel_sets(
            draw_no: int,
            count: int = 20,
            start_index: int = 0,
        ) -> List[dict]:
            del draw_no
            return _fallback_generate_wheel_sets(count=count, start_index=start_index)

        def _fallback_analyze_draw_duplicate_sets(draw_no: int, count: int = 20) -> dict:
            rows = _fallback_generate_wheel_sets(count=count, start_index=0, draw_no=draw_no)
            signature_counts: Dict[str, int] = {}
            for row in rows:
                signature = ",".join(str(row[f"num{i}"]) for i in range(1, 7))
                signature_counts[signature] = signature_counts.get(signature, 0) + 1

            duplicate_set_count = sum(1 for freq in signature_counts.values() if freq > 1)
            return {
                "drawNo": draw_no,
                "count": count,
                "duplicateSetCount": duplicate_set_count,
                "uniqueSetCount": len(signature_counts),
                "mode": "fallback-random",
            }

        return (
            _fallback_analyze_draw_duplicate_sets,
            _fallback_generate_jl_wheel_sets,
            _fallback_generate_wheel_sets,
        )
