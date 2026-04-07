# -*- coding: utf-8 -*-
"""pytest 경로 설정."""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_ROOT.parent
for _root in (PROJECT_ROOT, BACKEND_ROOT):
    if str(_root) not in sys.path:
        sys.path.insert(0, str(_root))
