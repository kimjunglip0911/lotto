import random
import uuid
from math import comb
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

def generate_lotterycodex_sets(count: int, draw_no: int) -> list[dict]:
    """
    조합론적 템플릿 분석(Lotterycodex Structural Approach)을 사용하여 로또 번호를 추천합니다.
    1. 4-Partition 분류 (LO, LE, HO, HE)
    2. 모든 가능한 템플릿의 이론적 확률 계산 (math.comb 이용)
    3. 과거 데이터 기반 빈도 가중치 보정
    4. 최적 템플릿 구조 2세트 DB 저장 및 반환
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    # 1. 데이터 조회 (해당 회차 미만 데이터)
    cursor.execute("""
        SELECT num1, num2, num3, num4, num5, num6 
        FROM lotto_winners 
        WHERE draw_no < ? 
        ORDER BY draw_no ASC
    """, (draw_no,))
    rows = cursor.fetchall()
    
    if len(rows) < 8:
        # 데이터가 거의 없어도 동작할 수 있는 순수 조합론 기법이지만, 
        # 시스템 안정성과 통계 유의성을 위해 최소 데이터 가드 유지
        conn.close()
        return []

    # 2. 4-Partition 정의 (6/45 로또 기준)
    # Low: 1~22, High: 23~45
    LO = [n for n in range(1, 23) if n % 2 != 0]   # 11개
    LE = [n for n in range(1, 23) if n % 2 == 0]    # 11개
    HO = [n for n in range(23, 46) if n % 2 != 0]   # 12개
    HE = [n for n in range(23, 46) if n % 2 == 0]    # 11개

    # 3. 모든 가능한 템플릿 열거 및 이론적 확률 계산
    total_combinations = comb(45, 6)
    templates = []
    
    # n_lo + n_le + n_ho + n_he = 6
    for n_lo in range(min(6, len(LO)) + 1):
        for n_le in range(min(6 - n_lo, len(LE)) + 1):
            for n_ho in range(min(6 - n_lo - n_le, len(HO)) + 1):
                n_he = 6 - n_lo - n_le - n_ho
                
                # HE 범위 체크 (0~11)
                if n_he < 0 or n_he > len(HE):
                    continue
                
                # 해당 템플릿의 조합 수 계산 (C(n, r) 성질 활용)
                count_combos = comb(len(LO), n_lo) * comb(len(LE), n_le) * \
                               comb(len(HO), n_ho) * comb(len(HE), n_he)
                               
                if count_combos == 0:
                    continue
                
                templates.append({
                    "pattern": (n_lo, n_le, n_ho, n_he),
                    "probability": count_combos / total_combinations
                })

    # 4. 과거 데이터 기반 실제 출현 빈도로 가중치 보정
    patterns_set = {
        "lo": set(LO),
        "le": set(LE),
        "ho": set(HO),
        "he": set(HE)
    }

    def classify_row(row):
        n_lo = sum(1 for n in row if n in patterns_set["lo"])
        n_le = sum(1 for n in row if n in patterns_set["le"])
        n_ho = sum(1 for n in row if n in patterns_set["ho"])
        n_he = sum(1 for n in row if n in patterns_set["he"])
        return (n_lo, n_le, n_ho, n_he)

    actual_counts = {}
    for row in rows:
        p = classify_row(row)
        actual_counts[p] = actual_counts.get(p, 0) + 1
    
    # 점수 계산: 이론 확률(0.6) + 실제 빈도(0.4)
    for t in templates:
        actual_freq = actual_counts.get(t["pattern"], 0) / len(rows)
        t["score"] = t["probability"] * 0.6 + actual_freq * 0.4

    # 점수 높은 순으로 정렬
    templates.sort(key=lambda x: x["score"], reverse=True)

    # 5. 번호 생성 (상위 2개 구조 채택)
    groups = [LO, LE, HO, HE]
    generated_list = []
    
    for i in range(count):
        # 상위 템플릿 구조로부터 번호 샘플링
        # count가 count_templates보다 크면 동일 구조 내에서 다른 샘플 시도
        template_idx = min(i, len(templates) - 1)
        pattern = templates[template_idx]["pattern"]
        
        # 무한 루프 방지를 위해 최대 20번 시도
        for _ in range(20):
            nums = []
            for group_idx, n_pick in enumerate(pattern):
                if n_pick > 0:
                    nums.extend(random.sample(groups[group_idx], n_pick))
            nums.sort()
            
            # 이미 생성된 세트와 중복되지 않는지 체크
            if nums not in generated_list:
                generated_list.append(nums)
                break
        else:
            # 시도 실패 시 그냥 추가 (로또 확률 상 중복은 거의 없음)
            if 'nums' in locals() and nums not in generated_list:
                generated_list.append(nums)

    # 6. DB 저장 및 반환
    method = "조합론적 템플릿 분석"
    group_id = f"group_lcdx_{uuid.uuid4().hex[:8]}"
    saved_sets = []

    for nums in generated_list[:count]:
        cursor.execute(queries.INSERT_DRAWING, (
            group_id,
            nums[0], nums[1], nums[2],
            nums[3], nums[4], nums[5],
            0, # bonus_num
            0, # draw_count
            method,
            draw_no
        ))

        saved_sets.append({
            "num1": nums[0], "num2": nums[1], "num3": nums[2],
            "num4": nums[3], "num5": nums[4], "num6": nums[5],
            "method": method,
            "draw_no": draw_no,
            "group_id": group_id
        })

    conn.commit()
    conn.close()
    return saved_sets

def get_scores(draw_no: int) -> list[float]:
    """
    조합론적 템플릿(Lotterycodex) 기법 점수를 1~45번 각 숫자 단위로 분배하여 정규화된 확률을 도출합니다.
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    cursor.execute("""
        SELECT num1, num2, num3, num4, num5, num6 
        FROM lotto_winners 
        WHERE draw_no < ? 
        ORDER BY draw_no ASC
    """, (draw_no,))
    rows = cursor.fetchall()
    conn.close()
    
    if len(rows) < 8:
        return [1.0 / 45.0 for _ in range(45)]

    LO = [n for n in range(1, 23) if n % 2 != 0]
    LE = [n for n in range(1, 23) if n % 2 == 0]
    HO = [n for n in range(23, 46) if n % 2 != 0]
    HE = [n for n in range(23, 46) if n % 2 == 0]

    total_combinations = comb(45, 6)
    templates = []
    
    for n_lo in range(min(6, len(LO)) + 1):
        for n_le in range(min(6 - n_lo, len(LE)) + 1):
            for n_ho in range(min(6 - n_lo - n_le, len(HO)) + 1):
                n_he = 6 - n_lo - n_le - n_ho
                if n_he < 0 or n_he > len(HE):
                    continue
                count_combos = comb(len(LO), n_lo) * comb(len(LE), n_le) * comb(len(HO), n_ho) * comb(len(HE), n_he)
                if count_combos == 0:
                    continue
                templates.append({
                    "pattern": (n_lo, n_le, n_ho, n_he),
                    "probability": count_combos / total_combinations
                })

    patterns_set = {"lo": set(LO), "le": set(LE), "ho": set(HO), "he": set(HE)}
    def classify_row(row):
        return (
            sum(1 for n in row if n in patterns_set["lo"]),
            sum(1 for n in row if n in patterns_set["le"]),
            sum(1 for n in row if n in patterns_set["ho"]),
            sum(1 for n in row if n in patterns_set["he"])
        )

    actual_counts = {}
    for row in rows:
        p = classify_row(row)
        actual_counts[p] = actual_counts.get(p, 0) + 1
    
    for t in templates:
        actual_freq = actual_counts.get(t["pattern"], 0) / len(rows)
        t["score"] = t["probability"] * 0.6 + actual_freq * 0.4

    templates.sort(key=lambda x: x["score"], reverse=True)

    # Convert template scores into 45 number scores. 
    # Use top 10 templates. Distribute score proportional to n_pick
    number_scores = {i: 0.1 for i in range(1, 46)}
    groups_list = [LO, LE, HO, HE]
    
    for t in templates[:10]:
        t_score = t["score"]
        pattern = t["pattern"]
        
        for group_idx, n_pick in enumerate(pattern):
            if n_pick > 0:
                group = groups_list[group_idx]
                dist_score = (t_score * n_pick) / len(group)
                for num in group:
                    number_scores[num] += dist_score

    # Normalize
    total_score = sum(number_scores.values())
    if total_score > 0:
        norm_probs = [number_scores[i] / total_score for i in range(1, 46)]
    else:
        norm_probs = [1.0 / 45.0 for _ in range(45)]
        
    return norm_probs
