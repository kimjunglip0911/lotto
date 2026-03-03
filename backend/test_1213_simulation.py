"""1213회 시뮬레이션: 5번 시도 내 최대 유사도 달성 검증"""
import os, sys
import numpy as np

# backend 디렉토리를 path에 추가
sys.path.insert(0, os.path.dirname(__file__))

from backend.domain.services.ensemble_engine import EnsembleEngine

ACTUAL_1213 = [5, 11, 25, 27, 36, 38]

def get_db_path():
    return os.path.join(os.path.dirname(__file__), 'infrastructure', 'persistence', 'lotto.db')

def run_simulation():
    db_path = get_db_path()
    engine = EnsembleEngine(db_path)
    
    print(f"Running 1213 Simulation (Target: {ACTUAL_1213})...")
    # generate_with_retry will automatically rank by similarity if numbers exist in DB
    results = engine.generate_with_retry(draw_no=1213, max_attempts=5)
    
    if not results:
        print("❌ No results generated.")
        return

    print(f"\nTop 10 Ranked Results for 1213 Draw:")
    print("-" * 60)
    for i, r in enumerate(results[:10]):
        numbers = r['numbers']
        match_count = len(set(numbers) & set(ACTUAL_1213))
        sim = r.get('similarity', 0)
        print(f"Rank {i+1} | {r['method']:<30} | {numbers} | Match: {match_count}/6 | Sim: {sim:.4f}")
    
    best = results[0]
    best_match = len(set(best['numbers']) & set(ACTUAL_1213))
    print("-" * 60)
    print(f"Best Result Similarity: {best.get('similarity', 0):.4f} ({best_match}/6 matches)")
    
    if best_match >= 4:
        print("✅ SUCCESS: Found a set with 4 or more matches!")
    else:
        print("⚠️ NOTE: Max matches found was less than 4, but similarity ranking is functional.")

if __name__ == '__main__':
    run_simulation()
