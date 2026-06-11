"""Text-based menu helpers for the CLI-only build.

The full curses TUI was removed; setup and config wizards use simple numbered
prompts instead of arrow-key navigation.
"""

from __future__ import annotations

import sys
from typing import Callable, Iterable, Optional, Set


def flush_stdin() -> None:
    """Best-effort drain of pending stdin (no-op when not a TTY)."""
    if not sys.stdin.isatty():
        return
    try:
        import select

        while select.select([sys.stdin], [], [], 0)[0]:
            if not sys.stdin.read(1):
                break
    except Exception:
        pass


def _read_choice(
    prompt: str,
    *,
    count: int,
    default: int,
    cancel_returns: Optional[int] = None,
) -> int:
    while True:
        try:
            raw = input(prompt).strip()
        except (KeyboardInterrupt, EOFError):
            print()
            if cancel_returns is not None:
                return cancel_returns
            raise
        if not raw:
            return default
        if raw.lower() in {"q", "quit", "cancel"}:
            if cancel_returns is not None:
                return cancel_returns
            return default
        try:
            idx = int(raw) - 1
        except ValueError:
            print(f"Enter a number between 1 and {count}, or press Enter for the default.")
            continue
        if 0 <= idx < count:
            return idx
        print(f"Enter a number between 1 and {count}, or press Enter for the default.")


def curses_radiolist(
    question: str,
    choices: list,
    *,
    selected: int = 0,
    cancel_returns: int = -1,
    description: str | None = None,
) -> int:
    """Single-select menu using numbered input."""
    if not choices:
        return cancel_returns

    print(question)
    if description:
        print(description)
    for i, choice in enumerate(choices):
        marker = "→" if i == selected else " "
        print(f"  {marker} {i + 1}. {choice}")
    print()
    return _read_choice(
        f"Choice [1-{len(choices)}] ({selected + 1}): ",
        count=len(choices),
        default=selected,
        cancel_returns=cancel_returns,
    )


def curses_single_select(
    title: str,
    items: list[str],
    *,
    default_index: int = 0,
) -> int | None:
    """Single-select menu; returns ``None`` when the user cancels."""
    if not items:
        return None

    print()
    print(title)
    for i, item in enumerate(items):
        marker = "→" if i == default_index else " "
        print(f"  {marker} {i + 1}. {item}")
    print()
    try:
        idx = _read_choice(
            f"Choice [1-{len(items)}] ({default_index + 1}, q to cancel): ",
            count=len(items),
            default=default_index,
            cancel_returns=None,
        )
    except (KeyboardInterrupt, EOFError):
        return None
    return idx


def curses_checklist(
    title: str,
    items: list,
    pre_selected: Iterable[int] | Set[int],
    *,
    cancel_returns: Set[int] | Iterable[int] | None = None,
    status_fn: Callable[[set[int]], str] | None = None,
) -> set[int]:
    """Multi-select checklist using numbered toggle input."""
    selected: set[int] = set(pre_selected)
    fallback = set(cancel_returns) if cancel_returns is not None else set(selected)

    print()
    print(title)
    print("Toggle items by number (comma-separated). Press Enter when done.")
    print()

    while True:
        for i, item in enumerate(items):
            mark = "x" if i in selected else " "
            print(f"  [{mark}] {i + 1}. {item}")
        if status_fn:
            print(f"  {status_fn(selected)}")
        print()
        try:
            raw = input("Toggle (e.g. 1,3) or Enter to continue: ").strip()
        except (KeyboardInterrupt, EOFError):
            print()
            return fallback
        if not raw:
            return selected
        if raw.lower() in {"q", "quit", "cancel"}:
            return fallback
        for part in raw.replace(" ", "").split(","):
            if not part:
                continue
            try:
                idx = int(part) - 1
            except ValueError:
                print(f"Invalid item: {part!r}")
                break
            if 0 <= idx < len(items):
                if idx in selected:
                    selected.discard(idx)
                else:
                    selected.add(idx)
            else:
                print(f"Invalid item number: {part}")
                break
        print()
