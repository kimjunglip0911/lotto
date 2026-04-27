import random
from typing import List

NUMBER_KEYS = ("num1", "num2", "num3", "num4", "num5", "num6", "bonus_num")


def build_number_counts(rows: List[dict]) -> List[int]:
    counts = [0] * 45
    for row in rows:
        for key in NUMBER_KEYS:
            value = row.get(key)
            if isinstance(value, int) and 1 <= value <= 45:
                counts[value - 1] += 1
    return counts


def _pick_number_by_count(counts: List[int], pick_max: bool) -> dict:
    if len(counts) != 45:
        raise ValueError("counts length must be 45")

    target_count = max(counts) if pick_max else min(counts)
    candidates = [index + 1 for index, count in enumerate(counts) if count == target_count]
    if not candidates:
        raise ValueError("no candidate number found")

    return {
        "number": candidates[0],
        "count": target_count,
        "is_tie": len(candidates) > 1,
        "candidates": candidates,
    }


def pick_top_number(counts: List[int]) -> dict:
    return _pick_number_by_count(counts, pick_max=True)


def pick_least_frequent_number(counts: List[int]) -> dict:
    return _pick_number_by_count(counts, pick_max=False)


def replace_excluded_in_rows(rows: List[dict], excluded_set: set[int]) -> List[dict]:
    """제외 번호가 포함된 세트를 남은 번호 풀에서 무작위 재추출로 교체한다."""
    if not excluded_set:
        return rows
    available_pool = [n for n in range(1, 46) if n not in excluded_set]
    if len(available_pool) < 6:
        return rows

    result: List[dict] = []
    for row in rows:
        nums = {
            int(row["num1"]),
            int(row["num2"]),
            int(row["num3"]),
            int(row["num4"]),
            int(row["num5"]),
            int(row["num6"]),
        }
        if nums & excluded_set:
            new_nums = sorted(random.sample(available_pool, 6))
            result.append(
                {
                    "num1": new_nums[0],
                    "num2": new_nums[1],
                    "num3": new_nums[2],
                    "num4": new_nums[3],
                    "num5": new_nums[4],
                    "num6": new_nums[5],
                }
            )
        else:
            result.append(row)
    return result
