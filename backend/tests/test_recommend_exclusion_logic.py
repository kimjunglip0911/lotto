import unittest

from backend.router.recommend import router as recommend_router


class RecommendExclusionLogicTests(unittest.TestCase):
    def test_build_number_counts_includes_bonus_numbers(self):
        rows = [
            {
                "num1": 1,
                "num2": 2,
                "num3": 3,
                "num4": 4,
                "num5": 5,
                "num6": 6,
                "bonus_num": 7,
            },
            {
                "num1": 7,
                "num2": 8,
                "num3": 9,
                "num4": 10,
                "num5": 11,
                "num6": 12,
                "bonus_num": 1,
            },
        ]

        counts = recommend_router.build_number_counts(rows)

        self.assertEqual(counts[0], 2)  # number 1
        self.assertEqual(counts[6], 2)  # number 7
        self.assertEqual(counts[44], 0)  # number 45

    def test_pick_least_frequent_number_uses_smallest_number_on_tie(self):
        counts = [0] * 45
        counts[4] = 1
        counts[5] = 1
        counts[6] = 3

        result = recommend_router.pick_least_frequent_number(counts)

        self.assertEqual(result["number"], 1)
        self.assertEqual(result["count"], 0)
        self.assertTrue(result["is_tie"])
        self.assertEqual(result["candidates"][0], 1)

    def test_pick_top_number_uses_smallest_number_on_tie(self):
        counts = [0] * 45
        counts[2] = 8
        counts[10] = 8
        counts[20] = 2

        result = recommend_router.pick_top_number(counts)

        self.assertEqual(result["number"], 3)
        self.assertEqual(result["count"], 8)
        self.assertTrue(result["is_tie"])
        self.assertEqual(result["candidates"], [3, 11])


if __name__ == "__main__":
    unittest.main()
