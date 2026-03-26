# -*- coding: utf-8 -*-
"""
연구 분석 통합 스크립트 (B-1, B-2, C-1, S-1 경계속도).

작업지시 요청사항 3~5번 + Speed 수학 분석에 대응하는 통계 분석을 수행한다.
결과는 콘솔 출력 + `연구 분석 결과.md` 에 기록.

사용법 (프로젝트 루트 기준):
  python -m features.analysis.scripts.run_research                  # 전체 분석 (B-1/B-2/C-1)
  python -m features.analysis.scripts.run_research --mode boundary   # S-1 경계속도 분석
  python -m features.analysis.scripts.run_research --mode boundary --target-set 2
  python -m features.analysis.scripts.run_research --write-result "features/analysis/scripts/연구 분석 결과.md"
"""
from __future__ import annotations

import argparse
import math
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True
_project_root = Path(__file__).resolve().parents[3]
_backend_root = _project_root / "backend"
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection
from features.analysis.api.jl_service import (
    FIXED_STOP_TIME,
    TWENTY_BASE_OFFSETS,
    TWENTY_BASE_SPEEDS,
)


# ---------------------------------------------------------------------------
# 공통 데이터 로드
# ---------------------------------------------------------------------------

def _fetch_all_draws() -> list[dict[str, Any]]:
    """전체 회차 데이터를 draw_no 오름차순으로 반환."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
        FROM lotto_winners
        ORDER BY draw_no ASC
        """
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def _draw_to_set(row: dict[str, Any]) -> set[int]:
    return {int(row[f"num{i}"]) for i in range(1, 7)}


# ---------------------------------------------------------------------------
# B-1: 연속 회차 번호 재출현율
# ---------------------------------------------------------------------------

def analyze_reappearance(draws: list[dict[str, Any]]) -> dict[str, Any]:
    """N회차 당첨번호 6개 중 N+1회차에 다시 나온 개수의 분포."""
    overlap_counts: list[int] = []
    for i in range(len(draws) - 1):
        prev = _draw_to_set(draws[i])
        curr = _draw_to_set(draws[i + 1])
        overlap_counts.append(len(prev & curr))

    dist = Counter(overlap_counts)
    total = len(overlap_counts)
    avg = sum(overlap_counts) / total if total else 0.0

    return {
        "total_pairs": total,
        "average_overlap": round(avg, 4),
        "distribution": {k: dist.get(k, 0) for k in range(7)},
        "distribution_pct": {
            k: round(dist.get(k, 0) / total * 100, 2) if total else 0.0
            for k in range(7)
        },
    }


def _format_reappearance(result: dict[str, Any]) -> list[str]:
    lines = [
        "### B-1. 연속 회차 번호 재출현율",
        "",
        f"- 분석 대상: 연속 {result['total_pairs']}쌍 (N회차 → N+1회차)",
        f"- 평균 재출현 개수: **{result['average_overlap']}개** / 6개",
        "",
        "| 재출현 개수 | 발생 횟수 | 비율(%) |",
        "|------------|----------|---------|",
    ]
    for k in range(7):
        cnt = result["distribution"][k]
        pct = result["distribution_pct"][k]
        lines.append(f"| {k}개 | {cnt} | {pct}% |")
    lines.append("")
    return lines


# ---------------------------------------------------------------------------
# B-2: 슬라이딩 윈도우 핫/콜드 번호
# ---------------------------------------------------------------------------

def analyze_hot_cold(
    draws: list[dict[str, Any]],
    windows: tuple[int, ...] = (10, 20, 30),
) -> dict[int, dict[str, Any]]:
    """최근 N회차 윈도우별 핫 번호 상위 10개, 콜드 번호 하위 10개."""
    results: dict[int, dict[str, Any]] = {}
    for w in windows:
        if len(draws) < w:
            continue
        recent = draws[-w:]
        freq: Counter[int] = Counter()
        for d in recent:
            for n in _draw_to_set(d):
                freq[n] += 1
        ordered = sorted(freq.items(), key=lambda x: (-x[1], x[0]))
        all_nums = sorted(
            ((n, freq.get(n, 0)) for n in range(1, 46)),
            key=lambda x: (x[1], x[0]),
        )
        results[w] = {
            "hot_10": ordered[:10],
            "cold_10": all_nums[:10],
            "top6": [n for n, _ in ordered[:6]],
        }
    return results


def _format_hot_cold(result: dict[int, dict[str, Any]]) -> list[str]:
    lines = ["### B-2. 슬라이딩 윈도우 핫/콜드 번호", ""]
    for w, data in sorted(result.items()):
        lines.append(f"#### 최근 {w}회차")
        lines.append("")
        lines.append(f"- **TOP6 시작번호 후보**: {data['top6']}")
        lines.append("")
        lines.append("| 순위 | 핫 번호 (출현↑) | 빈도 | 콜드 번호 (출현↓) | 빈도 |")
        lines.append("|------|----------------|------|------------------|------|")
        for i in range(10):
            hn, hf = data["hot_10"][i]
            cn, cf = data["cold_10"][i]
            lines.append(f"| {i+1} | {hn} | {hf} | {cn} | {cf} |")
        lines.append("")
    return lines


# ---------------------------------------------------------------------------
# C-1: 합계(Sum) 분포
# ---------------------------------------------------------------------------

def analyze_sum_distribution(draws: list[dict[str, Any]]) -> dict[str, Any]:
    """당첨 6번호 합계의 히스토그램 및 최빈 구간."""
    sums = [sum(_draw_to_set(d)) for d in draws]
    total = len(sums)
    avg = sum(sums) / total if total else 0.0
    min_s, max_s = min(sums), max(sums)

    bin_size = 10
    bins: dict[str, int] = {}
    for s in sums:
        lo = (s // bin_size) * bin_size
        key = f"{lo}~{lo + bin_size - 1}"
        bins[key] = bins.get(key, 0) + 1

    sorted_bins = sorted(bins.items(), key=lambda x: -x[1])
    top3_ranges = [b[0] for b in sorted_bins[:3]]

    return {
        "total_draws": total,
        "average": round(avg, 2),
        "min": min_s,
        "max": max_s,
        "bins": dict(sorted(bins.items(), key=lambda x: int(x[0].split("~")[0]))),
        "top3_ranges": top3_ranges,
    }


def _format_sum_distribution(result: dict[str, Any]) -> list[str]:
    lines = [
        "### C-1. 당첨번호 합계 분포",
        "",
        f"- 분석 대상: {result['total_draws']}회차",
        f"- 합계 평균: **{result['average']}**",
        f"- 합계 범위: {result['min']} ~ {result['max']}",
        f"- **최빈 구간 TOP3**: {', '.join(result['top3_ranges'])}",
        "",
        "| 합계 구간 | 회차 수 | 비율(%) |",
        "|----------|---------|---------|",
    ]
    for rng, cnt in result["bins"].items():
        pct = round(cnt / result["total_draws"] * 100, 2) if result["total_draws"] else 0.0
        lines.append(f"| {rng} | {cnt} | {pct}% |")
    lines.append("")
    return lines


# ---------------------------------------------------------------------------
# S-1: 경계 속도(Boundary Speed) 분석
# ---------------------------------------------------------------------------

_K = FIXED_STOP_TIME / 2.0  # distance = speed * K → K ≈ 21.8378


def _boundary_delta() -> float:
    """int(speed * K)가 1 증가하는 최소 speed 변화."""
    return 1.0 / _K


def _offset_for_speed(speed: float) -> int:
    """speed → int(distance) 값."""
    return int(speed * _K)


def _next_boundary_above(speed: float) -> float:
    """speed 바로 위에서 offset이 바뀌는 경계 speed."""
    current_int_dist = int(speed * _K)
    return (current_int_dist + 1) / _K


def _prev_boundary_below(speed: float) -> float:
    """speed 바로 아래에서 offset이 바뀌는 경계 speed."""
    current_int_dist = int(speed * _K)
    if speed * _K == current_int_dist:
        return (current_int_dist - 1) / _K
    return current_int_dist / _K


def analyze_boundary_speeds(
    target_sets: list[int] | None = None,
    neighbor_count: int = 10,
) -> dict[str, Any]:
    """
    각 세트의 현재 speed 기준으로 근방 경계 속도를 매핑한다.

    경계 속도 = int(speed * K)가 변하는 정확한 지점.
    이 지점에서만 결과 번호가 실제로 바뀌므로, 그 외 speed 변경은 무의미.
    """
    delta = _boundary_delta()
    sets = target_sets or list(range(1, 21))
    results: dict[int, dict[str, Any]] = {}

    for si in sets:
        if si < 1 or si > 20:
            continue
        speed = TWENTY_BASE_SPEEDS[si - 1]
        current_offset = int(TWENTY_BASE_OFFSETS[si - 1]) % 45
        current_mod45 = current_offset % 45

        boundaries: list[dict[str, Any]] = []
        for i in range(-neighbor_count, neighbor_count + 1):
            target_int_dist = current_offset + i
            boundary_speed = target_int_dist / _K
            if boundary_speed < 65.0 or boundary_speed > 135.0:
                continue
            mod45 = target_int_dist % 45
            boundaries.append({
                "speed": round(boundary_speed, 8),
                "int_dist": target_int_dist,
                "mod45": mod45,
                "delta_from_current": i,
                "is_current": i == 0,
            })

        idx = si - 1
        lo_neighbor = TWENTY_BASE_SPEEDS[idx - 1] if idx > 0 else 65.0
        hi_neighbor = TWENTY_BASE_SPEEDS[idx + 1] if idx < 19 else 135.0
        valid_boundaries = [
            b for b in boundaries
            if b["speed"] > lo_neighbor + 1e-9 and b["speed"] < hi_neighbor - 1e-9
        ]

        results[si] = {
            "current_speed": speed,
            "current_offset": current_offset,
            "current_mod45": current_mod45,
            "boundary_delta": round(delta, 8),
            "all_boundaries": boundaries,
            "valid_boundaries": valid_boundaries,
            "valid_count": len(valid_boundaries),
            "neighbor_range": f"{lo_neighbor:.4f} ~ {hi_neighbor:.4f}",
        }

    return {
        "K": round(_K, 8),
        "boundary_delta": round(delta, 8),
        "total_positions_on_wheel": 45,
        "sets": results,
    }


def _format_boundary(result: dict[str, Any]) -> list[str]:
    lines = [
        "### S-1. 경계 속도(Boundary Speed) 분석",
        "",
        f"- **K** = FIXED_STOP_TIME / 2 = {result['K']}",
        f"- **경계 delta** = 1/K = {result['boundary_delta']} "
        f"(이 간격마다 int(distance)가 1 증가 → 결과번호 1칸 이동)",
        f"- 원판 위치 수: {result['total_positions_on_wheel']} "
        f"(offset % 45이므로 최대 45가지 서로 다른 결과)",
        "",
    ]
    for si, data in sorted(result["sets"].items()):
        lines.append(f"#### 세트#{si}")
        lines.append("")
        lines.append(
            f"- 현재 speed: **{data['current_speed']}** "
            f"(offset={data['current_offset']}, mod45={data['current_mod45']})"
        )
        lines.append(f"- 이웃 세트 범위: {data['neighbor_range']}")
        lines.append(f"- 범위 내 유효 경계 수: **{data['valid_count']}개**")
        lines.append("")
        if data["valid_boundaries"]:
            lines.append("| 경계 speed | offset | mod45 | 현재 대비 |")
            lines.append("|-----------|--------|-------|----------|")
            for b in data["valid_boundaries"]:
                marker = " <-- 현재" if b["is_current"] else ""
                lines.append(
                    f"| {b['speed']:.6f} | {b['int_dist']} | {b['mod45']} "
                    f"| {b['delta_from_current']:+d}{marker} |"
                )
            lines.append("")
        else:
            lines.append("(유효 경계 없음 — 이웃 세트 간격이 경계 delta보다 좁음)")
            lines.append("")
    return lines


# ---------------------------------------------------------------------------
# 통합 리포트 생성
# ---------------------------------------------------------------------------

def _build_full_report(
    reappear: dict[str, Any] | None,
    hotcold: dict[int, dict[str, Any]] | None,
    sumrange: dict[str, Any] | None,
    boundary: dict[str, Any] | None = None,
) -> str:
    lines = [
        "# 연구 분석 결과",
        "",
        f"- 생성 시각(UTC): {datetime.now(timezone.utc).isoformat()}",
        "",
        "---",
        "",
    ]
    if boundary is not None:
        lines.extend(_format_boundary(boundary))
        lines.append("---")
        lines.append("")
    if reappear is not None:
        lines.extend(_format_reappearance(reappear))
        lines.append("---")
        lines.append("")
    if hotcold is not None:
        lines.extend(_format_hot_cold(hotcold))
        lines.append("---")
        lines.append("")
    if sumrange is not None:
        lines.extend(_format_sum_distribution(sumrange))
        lines.append("---")
        lines.append("")

    lines.append("> 본 분석은 통계 참고용이며 당첨을 보장하지 않습니다.")
    lines.append("")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _configure_stdio_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except (AttributeError, OSError, ValueError, TypeError):
                pass


def main() -> int:
    _configure_stdio_utf8()
    parser = argparse.ArgumentParser(description="연구 분석 통합 (B-1, B-2, C-1, S-1 경계속도)")
    parser.add_argument(
        "--mode",
        choices=["all", "reappear", "hotcold", "sumrange", "boundary"],
        default="all",
        help="실행할 분석 모드 (기본: all → B-1/B-2/C-1)",
    )
    parser.add_argument(
        "--target-set",
        type=int,
        nargs="*",
        default=None,
        metavar="N",
        help="경계속도 분석 대상 세트 번호 (미지정 시 전체 20세트)",
    )
    parser.add_argument(
        "--write-result",
        type=str,
        default=None,
        metavar="PATH",
        help="분석 결과 Markdown 저장 경로",
    )
    args = parser.parse_args()

    reappear = None
    hotcold = None
    sumrange = None
    boundary = None

    if args.mode == "boundary":
        print("[S-1] 경계 속도 분석 중...")
        boundary = analyze_boundary_speeds(target_sets=args.target_set)
        print(f"  K = {boundary['K']}, 경계 delta = {boundary['boundary_delta']}")
        for si, data in sorted(boundary["sets"].items()):
            print(
                f"  세트#{si}: speed={data['current_speed']}, "
                f"offset={data['current_offset']}, mod45={data['current_mod45']}, "
                f"유효 경계={data['valid_count']}개"
            )
    else:
        print("[연구 분석] 데이터 로드 중...")
        draws = _fetch_all_draws()
        if not draws:
            print("오류: lotto_winners 테이블에 데이터가 없습니다.", file=sys.stderr)
            return 1
        print(f"  총 {len(draws)}회차 로드 완료 ({draws[0]['draw_no']}~{draws[-1]['draw_no']})")

        if args.mode in ("all", "reappear"):
            print("[B-1] 연속 회차 번호 재출현율 분석...")
            reappear = analyze_reappearance(draws)
            print(f"  평균 재출현: {reappear['average_overlap']}개 / 6개")

        if args.mode in ("all", "hotcold"):
            print("[B-2] 슬라이딩 윈도우 핫/콜드 번호 분석...")
            hotcold = analyze_hot_cold(draws)
            for w, data in sorted(hotcold.items()):
                print(f"  최근 {w}회차 TOP6: {data['top6']}")

        if args.mode in ("all", "sumrange"):
            print("[C-1] 합계 분포 분석...")
            sumrange = analyze_sum_distribution(draws)
            print(f"  합계 평균: {sumrange['average']}, 최빈 구간: {sumrange['top3_ranges']}")

    report = _build_full_report(reappear, hotcold, sumrange, boundary=boundary)
    print("")
    print(report)

    if args.write_result:
        project_root = Path(__file__).resolve().parents[3]
        out = project_root / args.write_result
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(report, encoding="utf-8")
        print(f"결과 저장: {out}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
