import numpy as np
import sqlite3
from typing import Optional, List, Dict

import os

class EnsembleEngine:
    """MLP + RF 앙상블 투표 엔진 + 반복 최적화 + 유사도 폴백"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        from .ai_model import LottoMLPService
        from .ai_rf_model import LottoRFService
        self.mlp_service = LottoMLPService(db_path)
        self.rf_service = LottoRFService(db_path)

    def generate_with_retry(
        self,
        draw_no: Optional[int] = None,
        max_attempts: int = 5,
    ) -> List[Dict]:
        """최대 max_attempts번 반복하여 다양한 번호 세트를 생성.
        
        Returns:
            List[Dict]: 각 항목은 {"method": str, "numbers": List[int], "similarity": float | None}
        """
        all_sets: List[Dict] = []

        # 1단계: MLP/RF 각각 다중 예측 (각 시도별 시드를 기반으로 함)
        mlp_preds = self.mlp_service.predict_multiple(draw_no, n_iterations=max_attempts)
        rf_preds = self.rf_service.predict_multiple(draw_no, n_iterations=max_attempts)

        if not mlp_preds and not rf_preds:
            return []

        for attempt_idx in range(max_attempts):
            mlp_p = np.array(mlp_preds[attempt_idx % len(mlp_preds)]) if mlp_preds else np.ones(45) / 45
            rf_p = np.array(rf_preds[attempt_idx % len(rf_preds)]) if rf_preds else np.ones(45) / 45

            # 2단계: 앙상블 결합 (MLP 45% + RF 45% + Uniform 10%)
            ensemble = (mlp_p * 0.45) + (rf_p * 0.45) + (np.ones(45) / 45 * 0.10)
            ensemble = self._normalize(ensemble)

            # 3단계: 4가지 전략으로 번호 생성
            all_sets.extend(self._generate_sets(ensemble, attempt_idx))

        # 4단계: 시뮬레이션 모드 — 유사도 부여 및 정렬
        actual = self._get_actual_numbers(draw_no)
        if actual:
            for s in all_sets:
                s["similarity"] = self.calculate_similarity(s["numbers"], actual)
            # 유사도 점수와 정답 일치 개수 기반 정렬
            all_sets.sort(key=lambda x: (x["similarity"], len(set(x["numbers"]) & set(actual))), reverse=True)

        return all_sets

    def _generate_sets(self, probs: np.ndarray, attempt_idx: int) -> List[Dict]:
        """4가지 전략으로 번호 세트 생성."""
        sets = []
        
        # 확률 정규화 재확인
        probs = self._normalize(probs)

        # 전략 1: Top-K (상위 6개 확정)
        top6 = sorted(np.argsort(probs)[-6:][::-1].tolist())
        sets.append({
            "method": f"MLP+RF 앙상블 (Top-K #{attempt_idx+1})",
            "numbers": [int(i + 1) for i in top6],
            "similarity": None,
        })

        # 전략 2: Probability Sampling (확률 기반 샘플링)
        try:
            chosen_prob = np.random.choice(range(1, 46), 6, replace=False, p=probs).tolist()
            sets.append({
                "method": f"MLP+RF 앙상블 (Prob #{attempt_idx+1})",
                "numbers": sorted([int(n) for n in chosen_prob]),
                "similarity": None,
            })
        except:
            pass

        # 전략 3: Threshold Filter (상위 12개 중 6개 확률 조합)
        top12_indices = np.argsort(probs)[-12:][::-1].tolist()
        sub_p = probs[top12_indices]
        sub_p = self._normalize(sub_p)
        try:
            chosen_filter = np.random.choice(top12_indices, 6, replace=False, p=sub_p).tolist()
            sets.append({
                "method": f"MLP+RF 앙상블 (Filter #{attempt_idx+1})",
                "numbers": sorted([int(i + 1) for i in chosen_filter]),
                "similarity": None,
            })
        except:
            pass

        # 전략 4: Hybrid (상위 3개 고정 + 나머지 3개 확률 샘플링)
        top3_indices = np.argsort(probs)[-3:][::-1].tolist()
        mask = np.ones(45, dtype=bool)
        mask[top3_indices] = False
        remaining_p = probs[mask]
        remaining_p = self._normalize(remaining_p)
        remaining_indices = np.where(mask)[0]
        try:
            sampled_idx = np.random.choice(remaining_indices, 3, replace=False, p=remaining_p).tolist()
            combined = sorted([int(i + 1) for i in (top3_indices + sampled_idx)])
            sets.append({
                "method": f"MLP+RF 앙상블 (Hybrid #{attempt_idx+1})",
                "numbers": combined,
                "similarity": None,
            })
        except:
            pass

        return sets

    @staticmethod
    def calculate_similarity(predicted: List[int], actual: List[int]) -> float:
        """자카드 유사도 계산. 6/6 일치 시 1.0 반환."""
        s_pred, s_actual = set(predicted), set(actual)
        intersection = len(s_pred & s_actual)
        union = len(s_pred | s_actual)
        return intersection / union if union > 0 else 0.0

    def _get_actual_numbers(self, draw_no: Optional[int]) -> Optional[List[int]]:
        """draw_no에 해당하는 실제 당첨번호를 DB에서 조회."""
        if not draw_no:
            return None
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(
                "SELECT num1,num2,num3,num4,num5,num6 FROM lotto_winners WHERE draw_no=?",
                (draw_no,),
            )
            row = c.fetchone()
            conn.close()
            return list(row) if row else None
        except Exception as e:
            print(f"Error fetching actual numbers in EnsembleEngine: {e}")
            return None

    @staticmethod
    def _normalize(arr: np.ndarray) -> np.ndarray:
        """음수 제거 후 합이 1.0이 되도록 정규화."""
        arr = np.maximum(arr, 0)
        total = arr.sum()
        if total <= 0:
            return np.ones(len(arr)) / len(arr)
        p = arr / total
        # 합계가 정확히 1.0이 되도록 미세 조정
        p[0] += (1.0 - p.sum())
        return p
