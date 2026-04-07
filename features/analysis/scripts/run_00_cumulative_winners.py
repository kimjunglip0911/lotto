# -*- coding: utf-8 -*-
"""
0단계: 누적 당첨 번호 집계 스크립트.

- 1 ~ up_to_draw 구간의 본번호(num1~num6) 출현 빈도를 집계한다.
- 최고 누적 번호(top N), 최저 누적 번호(bottom N)를 산출한다.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.database import get_connection


def _configure_stdio_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except (AttributeError, OSError, ValueError, TypeError):
                pass


def compute_cumulative_frequency(up_to_draw: int) -> Counter[int]:
    """1~up_to_draw 구간 본번호 누적 빈도를 계산한다."""
    if up_to_draw < 1:
        raise ValueError("up_to_draw 는 1 이상이어야 합니다.")

    freq: Counter[int] = Counter()
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT num1, num2, num3, num4, num5, num6
            FROM lotto_winners
            WHERE draw_no >= 1 AND draw_no <= ?
            """,
            (up_to_draw,),
        )
        rows = cur.fetchall()

    if not rows:
        raise ValueError(f"1~{up_to_draw} 구간에 당첨 데이터가 없습니다.")

    for row in rows:
        for col in ("num1", "num2", "num3", "num4", "num5", "num6"):
            n = int(row[col])
            if 1 <= n <= 45:
                freq[n] += 1
    return freq


def top_bottom_numbers(freq: Counter[int], top_n: int, bottom_n: int) -> tuple[list[int], list[int]]:
    """빈도 카운터에서 상위/하위 번호 목록을 반환한다."""
    # 동률 정렬 규칙:
    # - 상위: 빈도 내림차순, 번호 오름차순
    # - 하위: 빈도 오름차순, 번호 오름차순
    all_nums = list(range(1, 46))
    top_sorted = sorted(all_nums, key=lambda n: (-freq.get(n, 0), n))
    bottom_sorted = sorted(all_nums, key=lambda n: (freq.get(n, 0), n))
    return top_sorted[:top_n], bottom_sorted[:bottom_n]


def build_payload(up_to_draw: int, top_n: int, bottom_n: int) -> dict[str, Any]:
    """누적 빈도 결과를 직렬화 가능한 payload로 만든다."""
    freq = compute_cumulative_frequency(up_to_draw)
    top_numbers, bottom_numbers = top_bottom_numbers(freq, top_n=top_n, bottom_n=bottom_n)
    freq_map = {str(n): int(freq.get(n, 0)) for n in range(1, 46)}
    return {
        "up_to_draw": int(up_to_draw),
        "top_numbers": top_numbers,
        "bottom_numbers": bottom_numbers,
        "top_n": int(top_n),
        "bottom_n": int(bottom_n),
        "freq_map": freq_map,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
    }


def main() -> None:
    _configure_stdio_utf8()
    parser = argparse.ArgumentParser(description="누적 당첨 번호(상위/하위) 집계")
    parser.add_argument("--up-to-draw", type=int, required=True, metavar="N", help="집계 마지막 회차(포함)")
    parser.add_argument("--top-n", type=int, default=5, metavar="K", help="상위 번호 개수(기본 5)")
    parser.add_argument("--bottom-n", type=int, default=5, metavar="K", help="하위 번호 개수(기본 5)")
    parser.add_argument("--write-json", type=str, default=None, metavar="PATH", help="결과 JSON 저장 경로")
    args = parser.parse_args()

    top_n = max(1, int(args.top_n))
    bottom_n = max(1, int(args.bottom_n))
    payload = build_payload(int(args.up_to_draw), top_n=top_n, bottom_n=bottom_n)

    if args.write_json:
        out = Path(args.write_json)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"누적 집계 JSON 저장: {out.resolve()}", file=sys.stderr)

    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
