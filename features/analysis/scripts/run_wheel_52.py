"""52회 테스트 실행 엔트리포인트.

이동 이후에도 기존 로직을 재사용하기 위해
`backend/scripts/run_wheel_52 copy.py` 의 `main()`을 호출한다.
"""

from pathlib import Path
import runpy


def main() -> int:
    legacy_file = (
        Path(__file__).resolve().parents[3]
        / "backend"
        / "scripts"
        / "run_wheel_52 copy.py"
    )
    namespace = runpy.run_path(str(legacy_file))
    return int(namespace["main"]())


if __name__ == "__main__":
    raise SystemExit(main())

