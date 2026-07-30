#!/usr/bin/env python3
"""Guards that the UMI site's claims stay synchronized with the source code.

Standalone: no pytest, no CI dependency. Run it directly:

    python UMI/tools/check_site_truth.py

Two kinds of check:

  * SITE-INTERNAL  -- always run; only read the UMI/ site files. They catch the
    common drift where one file is edited and its sibling isn't (e.g. the
    MODALITY_PRIORITY array vs. the prose that describes it, or the capability
    table wiring across data.js / app.js / overview.html).

  * CROSS-REPO     -- run only when the Brain-Score Unified checkout is
    locatable (env var BRAINSCORE_UNIFIED_ROOT, else a couple of default
    guesses). They catch the site claiming something the code no longer does
    (e.g. MODALITY_PRIORITY, the primary ABC name). When the source tree is not
    present (the public site repo cloned on its own) these SKIP, not fail.

Exit code is non-zero if any check fails. This is the replacement for the old
unified/tests/test_site_truth_sync.py, which broke when the site moved out of
the code repo into brain-score/public.
"""

import ast
import os
import re
import sys
from pathlib import Path

SITE_DIR = Path(__file__).resolve().parents[1]          # .../UMI
ARCH_JS = SITE_DIR / "architecture.js"
ARCH_HTML = SITE_DIR / "architecture.html"
DATA_JS = SITE_DIR / "data.js"
APP_JS = SITE_DIR / "app.js"
OVERVIEW_HTML = SITE_DIR / "overview.html"

def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _site_modality_priority() -> list:
    m = re.search(r"const MODALITY_PRIORITY = (\[[^\]]*\])", _read(ARCH_JS))
    assert m, "site MODALITY_PRIORITY array not found in architecture.js"
    return list(ast.literal_eval(m.group(1)))


def _prose_modality_list() -> list:
    m = re.search(r"MODALITY_PRIORITY \(([^)]*)\)", _read(ARCH_JS))
    assert m, "MODALITY_PRIORITY prose list not found in architecture.js"
    return [t.strip() for t in m.group(1).split(",")]


def _source_modality_priority(source_root: Path) -> list:
    src = _read(source_root / "core" / "brainscore_core" / "brainscore_model.py")
    m = re.search(r"MODALITY_PRIORITY[^\n=]*=\s*(\([^)]*\))", src)
    assert m, "source MODALITY_PRIORITY tuple not found"
    return list(ast.literal_eval(m.group(1)))


# ── site-internal checks ─────────────────────────────────────────────────────

def check_priority_array_matches_prose():
    """The tiebreak array and the sentence describing it must list the same
    modalities in the same order."""
    assert _site_modality_priority() == _prose_modality_list(), (
        f"architecture.js MODALITY_PRIORITY array {_site_modality_priority()} "
        f"disagrees with its own prose {_prose_modality_list()}")


def check_primary_abc_is_subject():
    """The site must present Subject as the primary ABC, not UnifiedModel."""
    html = _read(ARCH_HTML)
    assert "class Subject(ABC):" in html, "architecture.html lost 'class Subject(ABC):'"
    assert "class UnifiedModel(ABC):" not in html, (
        "architecture.html shows 'class UnifiedModel(ABC):' as primary; "
        "UnifiedModel is only the back-compat alias")


def check_capability_status_wiring():
    """data.js -> app.js -> overview.html capability-status chain stays wired."""
    data, app, overview = _read(DATA_JS), _read(APP_JS), _read(OVERVIEW_HTML)
    assert '"capability_status"' in data, "data.js lost the capability_status block"
    for key in ("capability-status-table", "capability-status-note"):
        assert key in app, f"app.js no longer populates #{key}"
        assert key in overview, f"overview.html no longer has #{key}"


# ── cross-repo checks ────────────────────────────────────────────────────────

def check_modality_priority_vs_source(source_root: Path):
    """Site tiebreak must equal core's exactly. (It is not allowed to append
    'video' — core canonicalizes video into vision upstream, and the site's
    pickByPriority() falls back to mods[0] for a lone video input, so a video
    stimulus routes correctly without a priority entry. Re-adding 'video' here
    would re-introduce the 'verbatim from core' drift this guard exists to catch.)"""
    site = _site_modality_priority()
    core = _source_modality_priority(source_root)
    assert site == core, f"site MODALITY_PRIORITY {site} != core {core}"


def check_source_abc_definition(source_root: Path):
    """The Subject-is-primary claim the site makes must hold in the source."""
    contract = _read(source_root / "core" / "brainscore_core" / "contract.py")
    assert "class Subject(ABC):" in contract, "core contract.py lost 'class Subject(ABC):'"
    assert "UnifiedModel = Subject" in contract, "core no longer aliases UnifiedModel = Subject"


# ── runner ───────────────────────────────────────────────────────────────────

def _find_source_root() -> Path | None:
    candidates = []
    env = os.environ.get("BRAINSCORE_UNIFIED_ROOT")
    if env:
        candidates.append(Path(env))
    candidates.append(SITE_DIR.parent.parent.parent / "Brain-Score Unified")
    candidates.append(Path.home() / "Brain-Score Unified")
    for c in candidates:
        if (c / "core" / "brainscore_core" / "brainscore_model.py").exists():
            return c
    return None


def main() -> int:
    site_internal = [
        check_priority_array_matches_prose,
        check_primary_abc_is_subject,
        check_capability_status_wiring,
    ]
    source_root = _find_source_root()
    cross_repo = [check_modality_priority_vs_source, check_source_abc_definition]

    failures = []
    for chk in site_internal:
        try:
            chk()
            print(f"PASS  {chk.__name__}")
        except AssertionError as e:
            failures.append((chk.__name__, str(e)))
            print(f"FAIL  {chk.__name__}: {e}")

    if source_root is None:
        print("SKIP  cross-repo checks (set BRAINSCORE_UNIFIED_ROOT to the "
              "Brain-Score Unified checkout to enable)")
    else:
        print(f"      (cross-repo source: {source_root})")
        for chk in cross_repo:
            try:
                chk(source_root)
                print(f"PASS  {chk.__name__}")
            except AssertionError as e:
                failures.append((chk.__name__, str(e)))
                print(f"FAIL  {chk.__name__}: {e}")

    print()
    if failures:
        print(f"{len(failures)} check(s) FAILED")
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
