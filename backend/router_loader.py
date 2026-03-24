import importlib.util
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent


def load_feature_router(feature_path: str):
    """Load `features/{feature_path}/api/router.py` without package requirements."""
    router_file = PROJECT_ROOT / "features" / feature_path / "api" / "router.py"
    if not router_file.exists():
        raise FileNotFoundError(f"Router not found: {router_file}")

    module_name = f"features.{feature_path.replace('/', '.')}.router"
    spec = importlib.util.spec_from_file_location(module_name, router_file)
    if spec is None or spec.loader is None:
        raise ImportError(f"Failed to create import spec for: {router_file}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.router

