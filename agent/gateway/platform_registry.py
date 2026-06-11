"""Stub platform registry — no messaging platforms in CLI-only build."""

from dataclasses import dataclass, field
from typing import Any, Callable, List, Optional


@dataclass
class PlatformEntry:
    name: str
    label: str = ""
    adapter_factory: Optional[Callable[..., Any]] = None
    check_fn: Optional[Callable[[], bool]] = None
    validate_config: Optional[Callable[..., Any]] = None
    required_env: List[str] = field(default_factory=list)
    install_hint: str = ""
    source: str = "bundled"
    plugin_name: Optional[str] = None


class _PlatformRegistry:
    def register(self, entry: PlatformEntry) -> None:
        pass

    def list_names(self) -> List[str]:
        return []


platform_registry = _PlatformRegistry()
