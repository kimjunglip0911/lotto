# -*- coding: utf-8 -*-
"""
다중 시드 검증 스크립트 (E-3).

작업지시 요청사항 6번에 대응.
현재 speed 배열(TWENTY_BASE_SPEEDS)을 seed 1~N으로 반복 평가하여
단일 시드 의존 여부를 검증한다.

사용법 (backend 디렉터리 기준):
  python -m scripts.run_multi_seed                     # seed 1~100, 기본
  python -m scripts.run_multi_seed --seeds 50           # seed 1~50
  python -m scripts.run_multi_seed --seeds 100 --write-result "features/analysis/scripts/연구 분석 결과.md"
"""
from __future__ import annotations

import argparse
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True
_project_root = Path(__file__).resolve().parents[3]
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

_backend_root = _project_root / "backend"
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from features.analysis.scripts.run_wheel_52 import (
    evaluate_wheel_52,
    fetch_latest_draw_nos_ascending,
    REQUIRED_DRAW_COUNT,
    DEFAULT_RANK_WEIGHTS,
)


def _weighted_score(ticket_counts: dict[int, int]) -> int:
    return sum(
        ticket_counts.get(t, 0) * int(DEFAULT_RANK_WEIGHTS.get(t, 0))
        for t in (1, 2, 3, 4, 5)
    )


def run_multi_seed(
    draw_nos: tuple[int, ...],
    seed_count: int = 100,
) -> dict[str, Any]:
    """seed 1~seed_count로 반복 평가, 등급별 통계 산출."""
    all_results: list[dict[str, Any]] = []
    scores: list[int] = []
    tier_totals: dict[int, list[int]] = {t: [] for t in (1, 2, 3, 4, 5)}

    for seed in range(1, seed_count + 1):
        result = evaluate_wheel_52(draw_nos, seed=seed)
        tc = result["ticket_counts"]
        all_results.append({"seed": seed, "ticket_counts": dict(tc)})
        scores.append(_weighted_score(tc))
        for t in (1, 2, 3, 4, 5):
            tier_totals[t].append(tc.get(t, 0))

        if seed % 10 == 0:
            print(f"  seed {seed}/{seed_count} 완료...")

    tier_stats: dict[int, dict[str, float]] = {}
    for t in (1, 2, 3, 4, 5):
        vals = tier_totals[t]
        tier_stats[t] = {
            "mean": round(statistics.mean(vals), 2),
            "median": round(statistics.median(vals), 2),
            "stdev": round(statistics.stdev(vals), 2) if len(vals) > 1 else 0.0,
            "min": min(vals),
            "max": max(vals),
        }

    best_seed_idx = scores.index(max(scores))
    worst_seed_idx = scores.index(min(scores))

    return {
        "seed_count": seed_count,
        "draw_range": f"{draw_nos[0]}~{draw_nos[-1]}",
        "tier_stats": tier_stats,
        "score_mean": round(statistics.mean(scores), 2),
        "score_median": round(statistics.median(scores), 2),
        "score_stdev": round(statistics.stdev(scores), 2) if len(scores) > 1 else 0.0,
        "best_seed": all_results[best_seed_idx],
        "worst_seed": all_results[worst_seed_idx],
        "seed42": next((r for r in all_results if r["seed"] == 42), None),
    }


def _format_report(result: dict[str, Any]) -> str:
    baseline = result.get("seed42", {}).get("ticket_counts", {}) if result.get("seed42") else {}
    med_1_4 = sum(float(result["tier_stats"][t]["median"]) for t in (1, 2, 3, 4))
    med_1_3 = sum(float(result["tier_stats"][t]["median"]) for t in (1, 2, 3))
    base_1_4 = sum(int(baseline.get(t, 0)) for t in (1, 2, 3, 4))
    base_1_3 = sum(int(baseline.get(t, 0)) for t in (1, 2, 3))
    gate_pass = (med_1_4 >= base_1_4) and (med_1_3 >= base_1_3)
    gate_reason = (
        "채택: 상위 등수(1~4등, 1~3등) 중앙값이 seed=42 기준 이상"
        if gate_pass
        else "기각: 상위 등수 중앙값이 seed=42 기준보다 낮음"
    )

    lines = [
        "### E-3. 다중 시드 검증 결과",
        "",
        f"- 시드 범위: 1 ~ {result['seed_count']}",
        f"- 평가 회차: {result['draw_range']} ({REQUIRED_DRAW_COUNT}회차 × 20세트)",
        f"- 가중 점수 — 평균: {result['score_mean']}, 중앙값: {result['score_median']}, 표준편차: {result['score_stdev']}",
        "",
        "#### 등급별 통계 (전 시드 기준)",
        "",
        "| 등수 | 평균 | 중앙값 | 표준편차 | 최소 | 최대 |",
        "|------|------|--------|---------|------|------|",
    ]
    for t in (1, 2, 3, 4, 5):
        s = result["tier_stats"][t]
        lines.append(
            f"| {t}등 | {s['mean']} | {s['median']} | {s['stdev']} | {s['min']} | {s['max']} |"
        )

    best = result["best_seed"]
    worst = result["worst_seed"]
    lines.extend([
        "",
        f"- **최고 시드**: seed={best['seed']} → {best['ticket_counts']}",
        f"- **최저 시드**: seed={worst['seed']} → {worst['ticket_counts']}",
    ])
    if result["seed42"]:
        s42 = result["seed42"]
        lines.append(f"- **seed=42 (현재 기준)**: {s42['ticket_counts']}")
        lines.append(
            f"- **게이트 판정**: {gate_reason} "
            f"(중앙값 1~4등={med_1_4}, 기준 1~4등={base_1_4}; "
            f"중앙값 1~3등={med_1_3}, 기준 1~3등={base_1_3})"
        )
    else:
        lines.append("- **게이트 판정**: 기준 seed=42 결과 없음 (판정 생략)")
    lines.extend(["", ""])
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
    parser = argparse.ArgumentParser(description="다중 시드 검증 (E-3)")
    parser.add_argument(
        "--seeds", type=int, default=100, help="검증할 시드 개수 (기본: 100, 즉 seed 1~100)"
    )
    parser.add_argument(
        "--write-result",
        type=str,
        default=None,
        metavar="PATH",
        help="결과를 기존 Markdown 파일 끝에 추가 (append)",
    )
    args = parser.parse_args()

    print(f"[다중 시드 검증] seed 1~{args.seeds} 평가 시작...")
    draw_nos = fetch_latest_draw_nos_ascending(REQUIRED_DRAW_COUNT)
    print(f"  회차 범위: {draw_nos[0]} ~ {draw_nos[-1]}")

    result = run_multi_seed(draw_nos, seed_count=args.seeds)
    report = _format_report(result)
    print("")
    print(report)

    if args.write_result:
        project_root = Path(__file__).resolve().parents[3]
        out = project_root / args.write_result
        out.parent.mkdir(parents=True, exist_ok=True)
        existing = out.read_text(encoding="utf-8") if out.exists() else ""
        separator = "\n---\n\n" if existing.strip() else ""
        out.write_text(existing + separator + report, encoding="utf-8")
        print(f"결과 추가 저장: {out}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
