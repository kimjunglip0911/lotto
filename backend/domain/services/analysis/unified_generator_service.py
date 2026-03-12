import random
import uuid
import itertools
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

# 각 기법별 점수 추출 함수 임포트
from domain.services.analysis.order_statistics_service import get_scores as get_os_scores
from domain.services.analysis.cdm.cdm_service import get_scores as get_cdm_scores
from domain.services.analysis.markov_service import get_scores as get_markov_scores
from domain.services.analysis.lstm_service import get_lstm_scores as get_lstm_scores_raw
from domain.services.analysis.cnn_service import get_cnn_scores
from domain.services.analysis.ga_service import get_scores as get_ga_scores
from domain.services.analysis.pso_service import get_scores as get_pso_scores
from domain.services.analysis.behavioral_service import get_scores as get_behav_scores
from domain.services.analysis.frequency_trend_service import get_scores as get_frequency_trend_scores

def get_lstm_scores(draw_no: int): return get_lstm_scores_raw(draw_no, "LSTM")
def get_bilstm_scores(draw_no: int): return get_lstm_scores_raw(draw_no, "Bi-LSTM")

METHODS = [
    ("순서 통계량", get_os_scores),
    ("CDM 바이시안", get_cdm_scores),
    ("마르코프 체인", get_markov_scores),
    ("LSTM", get_lstm_scores),
    ("Bi-LSTM", get_bilstm_scores),
    ("CNN", get_cnn_scores),
    ("유전 알고리즘", get_ga_scores),
    ("입자 군집 최적화", get_pso_scores),
    ("행동 경제학 분석", get_behav_scores),
    ("출현 빈도 및 추세 기법", get_frequency_trend_scores)
]

def resolve_duplicates(method_ranks: dict) -> list[int]:
    """
    Goal 4 로직
    method_ranks: { method_idx: [(num, score), (num, score), ...] } 상위 1~N위 정보
    각 기법에서 1위부터 후보를 하나씩 모아 10개의 고유한 번호를 생성합니다.
    번호 충돌 발생 시, 해당 번호에 대한 score가 더 높은 쪽이 선점! 
    탈락한 쪽은 다음 순위 번호를 가져와 다시 충돌 검사를 합니다.
    """
    # 현재 각 기법당 몇 번째 순위까지 탐색했는지 추적
    pointers = {idx: 0 for idx in range(10)}

    # { method_idx: current_num }
    current_picks = {}
    
    # 처음에는 모두 1위 번호 (0번 인덱스) 할당
    for idx in range(10):
        current_picks[idx] = method_ranks[idx][0][0]

    while True:
        # 번호별로 어느 method가 해당 번호를 점유하려는지 그룹화
        num_to_method = {}
        for idx, pick in current_picks.items():
            if pick not in num_to_method:
                num_to_method[pick] = []
            num_to_method[pick].append(idx)

        # 중복이 하나도 없으면 탈출
        if len(num_to_method) == 10:
            break

        # 중복 해결
        for pick_num, method_list in num_to_method.items():
            if len(method_list) > 1:
                # 점수 비교
                best_method = None
                best_score = -1.0
                
                for m_idx in method_list:
                    # 현재 가리키는 순서의 점수
                    curr_p = pointers[m_idx]
                    score = method_ranks[m_idx][curr_p][1]
                    if score > best_score:
                        best_score = score
                        best_method = m_idx

                # 최고 점수를 가진 메서드를 제외한 나머지는 포인터 증가 후 다시 번호 픽
                for m_idx in method_list:
                    if m_idx != best_method:
                        pointers[m_idx] += 1
                        if pointers[m_idx] < 45:
                            current_picks[m_idx] = method_ranks[m_idx][pointers[m_idx]][0]
                        else:
                            # 45까지 다 쓰면 남는 번호 아무거나 할당(안전 장치)
                            pool = [n for n in range(1, 46) if n not in current_picks.values()]
                            current_picks[m_idx] = pool[0]
        
    return list(current_picks.values())

def generate_optimal_20_sets(draw_no: int) -> list[dict]:
    # 1. 10개 기법 점수 (45개) 수집
    scores_dict = {}
    method_ranks = {}

    for idx, (m_name, func) in enumerate(METHODS):
        scores = func(draw_no)
        # (번호1~45, 점수) 튜플 리스트
        num_score_list = [(i+1, scores[i]) for i in range(45)]
        # 점수 기준 내림차순 정렬 (1위가 0번 인덱스)
        num_score_list.sort(key=lambda x: x[1], reverse=True)
        
        scores_dict[idx] = {"name": m_name, "scores": scores, "ranks": num_score_list}
        method_ranks[idx] = num_score_list

    sets_to_save = []
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # 2. 1차 세트: 기법별 베스트 1~6위 픽 1세트씩 = 10세트
    for idx in range(10):
        # 상위 6개 도출 (출현 빈도 및 추세 기법은 draw_no별 다양화)
        if idx == 9:
            # draw_no 시드로 상위 9개 중 6개 선택 → 회차별로 다른 베스트 세트
            rng = random.Random(draw_no)
            pool_size = min(9, 45)
            indices = sorted(rng.sample(range(pool_size), 6))
            best_nums = sorted([method_ranks[idx][i][0] for i in indices])
        else:
            best_nums = sorted([method_ranks[idx][i][0] for i in range(6)])
        method_name = f"{scores_dict[idx]['name']} 베스트"
        group_id = f"group_stage1_{uuid.uuid4().hex[:8]}"
        
        cursor.execute(queries.INSERT_DRAWING, (
            group_id, best_nums[0], best_nums[1], best_nums[2],
            best_nums[3], best_nums[4], best_nums[5],
            0, 0, method_name, draw_no
        ))
        
        sets_to_save.append({
            "num1": best_nums[0], "num2": best_nums[1], "num3": best_nums[2],
            "num4": best_nums[3], "num5": best_nums[4], "num6": best_nums[5],
            "method": method_name, "draw_no": draw_no, "group_id": group_id
        })

    # 3. 2차 세트: Goal 4 알고리즘 -> 10개 유니크 풀 뽑기
    best_pool = resolve_duplicates(method_ranks)
    
    # 이 10개의 숫자에서 나올 수 있는 6자리 조합은 C(10, 6) = 210개
    all_combinations = list(itertools.combinations(sorted(best_pool), 6))
    
    # 각 조합에 대해 전체 10개 기법의 점수를 종합하여 랭킹 매기기
    combo_scores = []
    for combo in all_combinations:
        total_score = 0.0
        for num in combo:
            # 10개 기법에서 해당 번호가 얻은 score의 총합
            for idx in range(10):
                total_score += scores_dict[idx]["scores"][num-1]
        combo_scores.append((combo, total_score))
        
    # 합산 스코어가 높은 순 정렬
    combo_scores.sort(key=lambda x: x[1], reverse=True)
    
    # 가장 높은 10개 세트를 2차 세트로 저장
    for i in range(10):
        combo_nums = combo_scores[i][0]
        method_name = "통합 최적 조합"
        group_id = f"group_stage2_{uuid.uuid4().hex[:8]}"
        
        cursor.execute(queries.INSERT_DRAWING, (
            group_id, combo_nums[0], combo_nums[1], combo_nums[2],
            combo_nums[3], combo_nums[4], combo_nums[5],
            0, 0, method_name, draw_no
        ))
        
        sets_to_save.append({
            "num1": combo_nums[0], "num2": combo_nums[1], "num3": combo_nums[2],
            "num4": combo_nums[3], "num5": combo_nums[4], "num6": combo_nums[5],
            "method": method_name, "draw_no": draw_no, "group_id": group_id
        })

    conn.commit()
    conn.close()

    return sets_to_save
