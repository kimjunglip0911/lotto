"""앙상블 엔진 단위 테스트"""
import os, sys
import numpy as np

# sys.path.insert 제거하고 패키지 임포트 사용
from backend.domain.services.ensemble_engine import EnsembleEngine

def get_db_path():
    return os.path.join(os.path.dirname(__file__), 'infrastructure', 'persistence', 'lotto.db')

def test_similarity():
    """자카드 유사도 계산 검증"""
    print("Testing similarity calculation...")
    # 완전 일치
    assert EnsembleEngine.calculate_similarity([5,11,25,27,36,38], [5,11,25,27,36,38]) == 1.0
    # 완전 불일치
    assert EnsembleEngine.calculate_similarity([1,2,3,4,5,6], [7,8,9,10,11,12]) == 0.0
    # 4개 일치 (인터섹션 4, 유니온 8) -> 4/8 = 0.5
    sim = EnsembleEngine.calculate_similarity([5,11,25,27,1,2], [5,11,25,27,36,38])
    assert abs(sim - 0.5) < 0.001
    print("✅ Similarity tests passed!")

def test_generate():
    """생성 기능 테스트"""
    print("Testing generate_with_retry...")
    db_path = get_db_path()
    if not os.path.exists(db_path):
        print(f"❌ DB not found at {db_path}")
        return

    engine = EnsembleEngine(db_path)
    # 1213회차로 테스트 (학습 데이터가 충분해야 함)
    results = engine.generate_with_retry(draw_no=1213, max_attempts=5)
    
    print(f"Generated {len(results)} sets.")
    assert len(results) >= 20  # 5 attempts * 4 strategies
    
    for r in results[:5]:
        print(f"  {r['method']}: {r['numbers']} (sim: {r.get('similarity', 'N/A')})")
    
    print("✅ Generation tests passed!")

if __name__ == '__main__':
    try:
        test_similarity()
        test_generate()
        print("\nAll unit tests passed successfully!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
