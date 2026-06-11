"""Stub gateway status helpers."""


def _pid_exists(pid: int) -> bool:
    try:
        import os
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def terminate_pid(pid: int) -> bool:
    try:
        import os
        import signal
        os.kill(pid, signal.SIGTERM)
        return True
    except OSError:
        return False
