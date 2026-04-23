import unittest

from backend.router.recommend import router as recommend_router


class RecommendJLServiceFallbackTests(unittest.TestCase):
    def test_load_jl_service_returns_fallback_when_features_module_missing(self):
        analyze, generate_and_save, generate = recommend_router._load_jl_service()

        generated = generate(count=5, start_index=0, draw_no=1221)
        generated_saved = generate_and_save(1221, count=5, start_index=0)
        insight = analyze(draw_no=1221, count=5)

        self.assertEqual(len(generated), 5)
        self.assertEqual(len(generated_saved), 5)
        self.assertIn("duplicateSetCount", insight)

        for row in generated:
            numbers = [int(row[f"num{i}"]) for i in range(1, 7)]
            self.assertEqual(len(numbers), 6)
            self.assertEqual(len(set(numbers)), 6)
            self.assertTrue(all(1 <= number <= 45 for number in numbers))


if __name__ == "__main__":
    unittest.main()
