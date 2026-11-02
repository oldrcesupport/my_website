"""Run the isolated mock-provider API flow; never targets a live deployment.

From the repository root: backend/venv/Scripts/python scripts/e2e_live_test.py
The Django test runner creates/uses its configured test database.
"""
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
result = subprocess.run(
    [sys.executable, "-m", "pytest", "tests/test_end_to_end_flow.py", "-q"],
    cwd=root / "backend",
    check=False,
)
raise SystemExit(result.returncode)
