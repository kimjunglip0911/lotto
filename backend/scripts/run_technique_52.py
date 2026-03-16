# -*- coding: utf-8 -*-
"""
기법용 통합 스크립트: 지정한 기법으로 52회(1164~1215) 회차당 1세트만 생성 후 분석.
합격 기준: 52회 중 5회 이상 4등(당첨 4개 일치) 이상.

사용: backend 디렉터리에서
  python -m scripts.run_technique_52 --method order_statistics
  python -m scripts.run_technique_52 --method frequency_trend
  python -m scripts.run_technique_52 --method cdm
  ... (cdm | markov | lstm | bilstm | cnn | ga | pso | behavioral)
"""
import argparse
import sys
import uuid
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

DRAW_NOS = tuple(range(1164, 1216))
PASS_THRESHOLD_4TH = 5  # 52회 중 4등 이상 5회 이상이면 합격


def _get_scorer(method: str):
    """기법명 → (get_scores 호출 가능, DB용 method 이름)."""
    name = method.strip().lower()
    if name == "order_statistics":
        from domain.services.analysis.order_statistics_service import get_scores
        return get_scores, "기법52_순서통계"
    if name == "frequency_trend":
        from domain.services.analysis.frequency_trend_service import get_scores
        return get_scores, "기법52_빈도추세"
    if name == "cdm":
        from domain.services.analysis.cdm.cdm_service import get_scores
        return get_scores, "기법52_CDM"
    if name == "markov":
        from domain.services.analysis.markov_service import get_scores
        return get_scores, "기법52_마르코프"
    if name == "lstm":
        from domain.services.analysis.lstm_service import get_lstm_scores
        def _s(draw_no: int):
            return get_lstm_scores(draw_no, "LSTM")
        return _s, "기법52_LSTM"
    if name == "bilstm":
        from domain.services.analysis.lstm_service import get_lstm_scores
        def _s(draw_no: int):
            return get_lstm_scores(draw_no, "Bi-LSTM")
        return _s, "기법52_BiLSTM"
    if name == "cnn":
        from domain.services.analysis.cnn_service import get_cnn_scores
        return get_cnn_scores, "기법52_CNN"
    if name == "ga":
        from domain.services.analysis.ga_service import get_scores
        return get_scores, "기법52_GA"
    if name == "pso":
        from domain.services.analysis.pso_service import get_scores
        return get_scores, "기법52_PSO"
    if name == "behavioral":
        from domain.services.analysis.behavioral_service import get_scores
        return get_scores, "기법52_행동경제학"
    raise ValueError(f"지원하지 않는 기법: {method}. order_statistics|frequency_trend|cdm|markov|lstm|bilstm|cnn|ga|pso|behavioral 중 하나.")


def generate_52_one_set(get_scores_fn, method_name: str) -> None:
    """52회 회차당 1세트 생성 후 DB 저장."""
    for i, draw_no in enumerate(DRAW_NOS):
        scores = get_scores_fn(draw_no)
        if len(scores) != 45:
            scores = (scores + [0.0] * 45)[:45]
        num_rank = [(j + 1, float(scores[j])) for j in range(45)]
        num_rank.sort(key=lambda x: x[1], reverse=True)
        best_nums = sorted([num_rank[k][0] for k in range(6)])

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.DELETE_DRAWINGS_BY_NO_AND_METHOD, (draw_no, method_name))
        cursor.execute(
            queries.INSERT_DRAWING,
            (
                f"tech52_{uuid.uuid4().hex[:8]}",
                best_nums[0], best_nums[1], best_nums[2], best_nums[3], best_nums[4], best_nums[5],
                0, 0, method_name, draw_no,
            ),
        )
        conn.commit()
        conn.close()
        if (i + 1) % 10 == 0 or i == 0 or i == len(DRAW_NOS) - 1:
            print(f"  회차 {draw_no}: 1세트 저장 완료")
    print(f"52회 생성 완료 (method={method_name})")


def analyze_52_fourth_or_better(method_name: str, verbose: bool = True) -> tuple[int, int]:
    """52회 중 4등(4개 일치) 이상 회차 수 반환. (4등 이상 회차 수, 분석 가능 회차 수)."""
    conn = get_connection()
    cursor = conn.cursor()
    ph = ",".join("?" * len(DRAW_NOS))
    cursor.execute(
        f"SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_winners WHERE draw_no IN ({ph}) ORDER BY draw_no",
        DRAW_NOS,
    )
    winners = {dict(r)["draw_no"]: {r["num1"], r["num2"], r["num3"], r["num4"], r["num5"], r["num6"]} for r in cursor.fetchall()}
    cursor.execute(
        f"SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_drawings WHERE draw_no IN ({ph}) AND method = ? ORDER BY draw_no",
        (*DRAW_NOS, method_name),
    )
    rows = cursor.fetchall()
    conn.close()

    by_draw = {}
    for r in rows:
        d = dict(r)
        dn = d["draw_no"]
        if dn not in by_draw:
            by_draw[dn] = []
        by_draw[dn].append({d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]})

    count_4th_plus = 0
    total_ok = 0
    for dn in DRAW_NOS:
        if dn not in winners:
            continue
        total_ok += 1
        sets_list = by_draw.get(dn, [])
        if not sets_list:
            continue
        s = sets_list[0]
        match = len(winners[dn] & s)
        if match >= 4:
            count_4th_plus += 1

    if verbose:
        print("=" * 60)
        print(f"52회 기법 분석 (method={method_name}) — 4등(4개 일치) 이상 회차 수")
        print("=" * 60)
        print(f"분석 가능 회차: {total_ok}회, 4등 이상 회차: {count_4th_plus}회")
        print(f"합격 기준(>={PASS_THRESHOLD_4TH}회): {'달성' if count_4th_plus >= PASS_THRESHOLD_4TH else '미달'}")
        print("=" * 60)
    return count_4th_plus, total_ok


def main() -> None:
    parser = argparse.ArgumentParser(description="기법 52회 1세트 생성 및 분석 (4등 5회 이상 합격)")
    parser.add_argument("--method", "-m", required=True, help="order_statistics|frequency_trend|cdm|markov|lstm|bilstm|cnn|ga|pso|behavioral")
    parser.add_argument("--analyze-only", action="store_true", help="생성 생략, 기존 저장분만 분석")
    args = parser.parse_args()

    get_scores_fn, method_name = _get_scorer(args.method)
    if not args.analyze_only:
        print(f"[{args.method}] 52회 회차당 1세트 생성 중...")
        generate_52_one_set(get_scores_fn, method_name)
    print(f"[{args.method}] 분석 중...")
    count, total = analyze_52_fourth_or_better(method_name, verbose=True)
    if count >= PASS_THRESHOLD_4TH:
        print("→ 고도화 합격.")
    else:
        print("→ 고도화 미달. 상수 조정 후 재실행하세요.")
    sys.exit(0 if count >= PASS_THRESHOLD_4TH else 1)


if __name__ == "__main__":
    main()
