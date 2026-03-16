# -*- coding: utf-8 -*-
"""
10개 기법의 점수를 가중 합산하는 융합 기법. 기존 서비스 상수는 변경하지 않음.
52회 20세트 생성용. 목표: 52회 중 26회 이상에서 20세트 중 1세트라도 5등 이상.
"""
import itertools
from domain.services.analysis.order_statistics_service import get_scores as get_os_scores
from domain.services.analysis.cdm.cdm_service import get_scores as get_cdm_scores
from domain.services.analysis.markov_service import get_scores as get_markov_scores
from domain.services.analysis.lstm_service import get_lstm_scores as get_lstm_scores_raw
from domain.services.analysis.cnn_service import get_cnn_scores
from domain.services.analysis.ga_service import get_scores as get_ga_scores
from domain.services.analysis.pso_service import get_scores as get_pso_scores
from domain.services.analysis.behavioral_service import get_scores as get_behav_scores
from domain.services.analysis.frequency_trend_service import get_scores as get_frequency_trend_scores

def _get_lstm(draw_no: int): return get_lstm_scores_raw(draw_no, "LSTM")
def _get_bilstm(draw_no: int): return get_lstm_scores_raw(draw_no, "Bi-LSTM")

_SCORERS = [
    get_os_scores,
    get_cdm_scores,
    get_markov_scores,
    _get_lstm,
    _get_bilstm,
    get_cnn_scores,
    get_ga_scores,
    get_pso_scores,
    get_behav_scores,
    get_frequency_trend_scores,
]

# 융합 가중치 (합=1 권장). 순서: 순서통계량, CDM, 마르코프, LSTM, Bi-LSTM, CNN, GA, PSO, 행동경제학, 출현빈도·추세
WEIGHTS = [0.35, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.08, 0.08]  # tune_fusion_52_grid 최고: 순서통계_단독강화


def get_scores(draw_no: int, weights: list[float] | None = None) -> list[float]:
    """10개 기법 점수의 가중 합산 후 정규화. 길이 45."""
    w = weights if weights is not None else WEIGHTS
    if len(w) != 10:
        w = WEIGHTS
    fused = [0.0] * 45
    for scorer, weight in zip(_SCORERS, w):
        s = scorer(draw_no)
        for i in range(45):
            fused[i] += weight * s[i]
    total = sum(fused)
    if total <= 0:
        return [1.0 / 45.0] * 45
    return [x / total for x in fused]


TOP_CANDIDATES_FOR_DIVERSITY = 80
NUM_SETS = 20


def select_diverse_top_n(combo_scores: list, n: int) -> list[tuple]:
    """점수 상위 후보 중 겹침 최소화 Greedy로 n개 조합 반환."""
    if len(combo_scores) <= n:
        return [c[0] for c in combo_scores]
    selected: list[tuple] = [combo_scores[0][0]]
    used = {0}
    end = min(TOP_CANDIDATES_FOR_DIVERSITY + 1, len(combo_scores))
    for _ in range(n - 1):
        best_idx = None
        best_overlap = 7
        best_score = -1.0
        for i in range(1, end):
            if i in used:
                continue
            combo, score = combo_scores[i]
            max_overlap = max(len(set(combo) & set(s)) for s in selected)
            if max_overlap < best_overlap or (max_overlap == best_overlap and score > best_score):
                best_overlap = max_overlap
                best_score = score
                best_idx = i
        if best_idx is None:
            for i in range(end, len(combo_scores)):
                if i not in used:
                    best_idx = i
                    break
        if best_idx is None:
            break
        selected.append(combo_scores[best_idx][0])
        used.add(best_idx)
    return selected


def generate_20_sets(draw_no: int, weights: list[float] | None = None) -> list[tuple]:
    """융합 점수로 20세트(6개 번호 튜플) 반환. 다양화 적용."""
    scores = get_scores(draw_no, weights)
    num_rank = [(i + 1, scores[i]) for i in range(45)]
    num_rank.sort(key=lambda x: x[1], reverse=True)
    # 상위 20개 번호 풀에서 조합 생성 (C(20,6)=38760)
    pool_size = 20
    pool = [num_rank[i][0] for i in range(pool_size)]
    combos = list(itertools.combinations(pool, 6))
    combo_scores = []
    for c in combos:
        combo_scores.append((c, sum(scores[n - 1] for n in c)))
    combo_scores.sort(key=lambda x: x[1], reverse=True)
    return select_diverse_top_n(combo_scores, NUM_SETS)
