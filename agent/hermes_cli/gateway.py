"""Gateway CLI — stubbed in CLI-only build (messaging removed)."""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.resolve()

_SERVICE_BASE = "hermes-gateway"
_PLATFORMS: list[dict] = []

_REMOVED_MSG = (
    "Messaging gateway was removed. Use `hermes chat` for CLI-only interaction."
)

_SYSTEMD_OPTIONAL_DIRECTIVES = (
    "RestartMaxDelaySec",
    "RestartSteps",
)

DEFAULT_GATEWAY_RESTART_DRAIN_TIMEOUT = 30.0


class UserSystemdUnavailableError(RuntimeError):
    pass


class SystemScopeRequiresRootError(RuntimeError):
    pass


@dataclass(frozen=True)
class GatewayRuntimeSnapshot:
    manager: str
    service_installed: bool = False
    service_running: bool = False
    gateway_pids: tuple[int, ...] = ()
    service_scope: str | None = None

    @property
    def running(self) -> bool:
        return self.service_running or bool(self.gateway_pids)

    @property
    def has_process_service_mismatch(self) -> bool:
        return self.service_installed and self.running and not self.service_running


@dataclass(frozen=True)
class ProfileGatewayProcess:
    profile: str
    path: Path
    pid: int


def is_linux() -> bool:
    return sys.platform.startswith("linux")


def is_macos() -> bool:
    return sys.platform == "darwin"


def is_windows() -> bool:
    return sys.platform == "win32"


def supports_systemd_services() -> bool:
    return False


def _profile_suffix() -> str:
    import hashlib
    import re

    from hermes_constants import get_default_hermes_root
    from hermes_cli.config import get_hermes_home

    home = get_hermes_home().resolve()
    default = get_default_hermes_root().resolve()
    if home == default:
        return ""
    profiles_root = (default / "profiles").resolve()
    try:
        rel = home.relative_to(profiles_root)
        parts = rel.parts
        if len(parts) == 1 and re.match(r"^[a-z0-9][a-z0-9_-]{0,63}$", parts[0]):
            return parts[0]
    except ValueError:
        pass
    return hashlib.sha256(str(home).encode()).hexdigest()[:8]


def _profile_arg(hermes_home: str | None = None) -> str:
    import re

    from hermes_constants import get_default_hermes_root
    from hermes_cli.config import get_hermes_home

    home = Path(hermes_home or str(get_hermes_home())).resolve()
    default = get_default_hermes_root().resolve()
    if home == default:
        return ""
    profiles_root = (default / "profiles").resolve()
    try:
        rel = home.relative_to(profiles_root)
        parts = rel.parts
        if len(parts) == 1 and re.match(r"^[a-z0-9][a-z0-9_-]{0,63}$", parts[0]):
            return f"--profile {parts[0]}"
    except ValueError:
        pass
    return ""


def get_service_name() -> str:
    suffix = _profile_suffix()
    if not suffix:
        return _SERVICE_BASE
    return f"{_SERVICE_BASE}-{suffix}"


def get_systemd_unit_path(system: bool = False) -> Path:
    from hermes_cli.config import get_hermes_home

    if system:
        return Path("/etc/systemd/system") / f"{get_service_name()}.service"
    return (
        Path.home()
        / ".config"
        / "systemd"
        / "user"
        / f"{get_service_name()}.service"
    )


def get_launchd_plist_path() -> Path:
    return Path.home() / "Library" / "LaunchAgents" / f"{get_launchd_label()}.plist"


def get_launchd_label() -> str:
    suffix = _profile_suffix()
    if not suffix:
        return "com.hermes.gateway"
    return f"com.hermes.gateway.{suffix}"


def _detect_venv_dir() -> Path | None:
    venv = PROJECT_ROOT / ".venv"
    return venv if venv.is_dir() else None


def get_python_path() -> str:
    venv = _detect_venv_dir()
    if venv is not None:
        if is_windows():
            venv_python = venv / "Scripts" / "python.exe"
        else:
            venv_python = venv / "bin" / "python"
        if venv_python.exists():
            return str(venv_python)
    return sys.executable


def _normalize_service_definition(text: str) -> str:
    return "\n".join(line.rstrip() for line in text.strip().splitlines())


def _strip_optional_systemd_directives(text: str) -> str:
    lines = text.splitlines()
    filtered = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            key = stripped.split("=", 1)[0].strip()
            if key in _SYSTEMD_OPTIONAL_DIRECTIVES:
                continue
        filtered.append(line)
    return "\n".join(filtered)


def _get_service_pids() -> set[int]:
    return set()


def find_gateway_pids(
    exclude_pids: set[int] | None = None,
    all_profiles: bool = False,
) -> list[int]:
    return []


def find_profile_gateway_processes(
    exclude_pids: set[int] | None = None,
) -> list[ProfileGatewayProcess]:
    return []


def kill_gateway_processes(**kwargs) -> int:
    return 0


def launch_detached_profile_gateway_restart(profile: str, old_pid: int) -> bool:
    return False


def _graceful_restart_via_sigusr1(pid: int, drain_timeout: float) -> bool:
    return False


def _wait_for_gateway_exit(timeout: float = 5.0, force_after: float | None = None) -> None:
    return None


def _get_restart_drain_timeout() -> float:
    return DEFAULT_GATEWAY_RESTART_DRAIN_TIMEOUT


def get_gateway_runtime_snapshot(system: bool = False) -> GatewayRuntimeSnapshot:
    return GatewayRuntimeSnapshot(manager="none")


def _format_gateway_pids(pids: tuple[int, ...] | list[int]) -> str:
    if not pids:
        return "(none)"
    return ", ".join(str(p) for p in pids)


def _all_platforms() -> list[dict]:
    return []


def _platform_status(platform: dict) -> str:
    return "not available"


def _configure_platform(platform: dict) -> None:
    print(_REMOVED_MSG)


def _setup_qqbot() -> None:
    print(_REMOVED_MSG)


def _is_service_installed() -> bool:
    return False


def _is_service_running() -> bool:
    return False


def has_conflicting_systemd_units() -> bool:
    return False


def has_legacy_hermes_units() -> bool:
    return False


def _find_legacy_hermes_units() -> list[tuple[str, Path, bool]]:
    return []


def print_legacy_unit_warning() -> None:
    return None


def print_systemd_scope_conflict_warning() -> None:
    return None


def install_linux_gateway_from_setup(
    force: bool = False,
    enable_on_startup: bool = True,
) -> tuple[str | None, bool]:
    print(_REMOVED_MSG)
    return None, False


def _system_scope_wizard_would_need_root(system: bool = False) -> bool:
    return False


def _print_system_scope_remediation(action: str) -> None:
    print(_REMOVED_MSG)


def _ensure_user_systemd_env() -> None:
    return None


def _probe_systemd_service_running(system: bool = False) -> tuple[bool, bool]:
    return False, False


def _probe_launchd_service_running() -> bool:
    return False


def get_systemd_linger_status() -> tuple[bool | None, str]:
    return None, "messaging gateway removed"


def _systemctl_cmd(system: bool = False) -> list[str]:
    return ["systemctl", "--user"] if not system else ["systemctl"]


def systemd_start(system: bool = False) -> None:
    print(_REMOVED_MSG)


def systemd_stop(system: bool = False) -> None:
    print(_REMOVED_MSG)


def systemd_restart(system: bool = False) -> None:
    print(_REMOVED_MSG)


def launchd_install(force: bool = False) -> None:
    print(_REMOVED_MSG)


def launchd_start() -> None:
    print(_REMOVED_MSG)


def launchd_stop() -> None:
    print(_REMOVED_MSG)


def launchd_restart() -> None:
    print(_REMOVED_MSG)


def gateway_command(args) -> int:
    print(_REMOVED_MSG)
    return 1
