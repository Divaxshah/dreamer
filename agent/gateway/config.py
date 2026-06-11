"""Stub gateway config — messaging platforms removed."""

from enum import Enum


class Platform(Enum):
    LOCAL = "cli"


def load_gateway_config():
    return {}
