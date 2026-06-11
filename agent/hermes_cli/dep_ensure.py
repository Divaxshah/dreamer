"""Lazy dependency bootstrapper for non-Python runtime deps.

Detection and prompting live here in Python because shutil.which() works on
every platform and the check is instant.

Deps that degrade gracefully (ripgrep → grep fallback, ffmpeg → skip conversion)
don't need ensure_dependency wired in — only hard-fail sites do (TUI needs node,
browser tool needs agent-browser).
"""
from __future__ import annotations

import platform
import shutil

_IS_WINDOWS = platform.system() == "Windows"

_DEP_CHECKS = {
    "node": lambda: shutil.which("node") is not None,
    "browser": lambda: (
        shutil.which("agent-browser") is not None
        or _has_system_browser()
        or _has_hermes_agent_browser()
    ),
    "ripgrep": lambda: shutil.which("rg") is not None,
    "ffmpeg": lambda: shutil.which("ffmpeg") is not None,
}

_DEP_DESCRIPTIONS = {
    "node": "Node.js (required for browser tools and TUI)",
    "browser": "Browser engine (Chromium, for web browsing tools)",
    "ripgrep": "ripgrep (fast file search)",
    "ffmpeg": "ffmpeg (TTS voice messages)",
}


def _has_system_browser() -> bool:
    if _IS_WINDOWS:
        names = ("chrome", "msedge", "chromium")
    else:
        names = ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome")
    for name in names:
        if shutil.which(name):
            return True
    return False


def _has_hermes_agent_browser() -> bool:
    from hermes_constants import get_hermes_home
    home = get_hermes_home()
    if _IS_WINDOWS:
        return (home / "node" / "agent-browser.cmd").is_file()
    return (
        (home / "node" / "bin" / "agent-browser").is_file()
        or (home / "node_modules" / ".bin" / "agent-browser").is_file()
    )


def ensure_dependency(
    dep: str,
    interactive: bool = True,
) -> bool:
    """Ensure a non-Python dependency is available. Returns True if available."""
    check = _DEP_CHECKS.get(dep)
    if check is None:
        return False
    if check():
        return True

    if interactive:
        desc = _DEP_DESCRIPTIONS.get(dep, dep)
        print(f"  {desc} is not installed.")
        print(f"  Install {dep} manually and try again.")
    return False
