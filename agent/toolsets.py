#!/usr/bin/env python3
"""
Toolsets Module

CLI-only build: software-dev toolsets only.
"""

from typing import List, Dict, Any, Set, Optional


# Toolsets exposed in `hermes tools`, `/toolsets`, and default CLI sessions.
CLI_ONLY_TOOLSETS = frozenset({
    "web",
    "terminal",
    "file",
    "code_execution",
    "vision",
    "skills",
    "todo",
    "delegation",
    "debugging",
    "hermes-cli",
    "hermes-api-server",
    "webmaker",
})

# Shared tool list for the interactive CLI.
_HERMES_CORE_TOOLS = [
    "web_search",
    "web_extract",
    "terminal",
    "process",
    "read_file",
    "write_file",
    "patch",
    "search_files",
    "vision_analyze",
    "skills_list",
    "skill_view",
    "skill_manage",
    "todo",
    "execute_code",
    "delegate_task",
]

_HERMES_API_SERVER_TOOLS = list(_HERMES_CORE_TOOLS)

TOOLSETS = {
    "web": {
        "description": "Web research and content extraction tools",
        "tools": ["web_search", "web_extract"],
        "includes": [],
    },
    "vision": {
        "description": "Image analysis and vision tools",
        "tools": ["vision_analyze"],
        "includes": [],
    },
    "terminal": {
        "description": "Terminal/command execution and process management tools",
        "tools": ["terminal", "process"],
        "includes": [],
    },
    "skills": {
        "description": "Access, create, edit, and manage skill documents with specialized instructions and knowledge",
        "tools": ["skills_list", "skill_view", "skill_manage"],
        "includes": [],
    },
    "file": {
        "description": "File manipulation tools: read, write, patch (with fuzzy matching), and search (content + files)",
        "tools": ["read_file", "write_file", "patch", "search_files"],
        "includes": [],
    },
    "todo": {
        "description": "Task planning and tracking for multi-step work",
        "tools": ["todo"],
        "includes": [],
    },
    "code_execution": {
        "description": "Run Python scripts that call tools programmatically (reduces LLM round trips)",
        "tools": ["execute_code"],
        "includes": [],
    },
    "delegation": {
        "description": "Spawn subagents with isolated context for complex subtasks",
        "tools": ["delegate_task"],
        "includes": [],
    },
    "debugging": {
        "description": "Debugging and troubleshooting toolkit",
        "tools": ["terminal", "process"],
        "includes": ["web", "file"],
    },
    "hermes-api-server": {
        "description": "OpenAI-compatible API server — agent tools accessible via HTTP",
        "tools": _HERMES_API_SERVER_TOOLS,
        "includes": [],
    },
    "hermes-cli": {
        "description": "Full interactive CLI toolset for software development",
        "tools": _HERMES_CORE_TOOLS,
        "includes": [],
    },
    "webmaker": {
        "description": "Headless frontend Webmaker workspace tools",
        "tools": [
            "web_search",
            "web_extract",
            "terminal",
            "read_file",
            "write_file",
            "patch",
            "search_files",
            "vision_analyze",
            "skills_list",
            "skill_view",
            "todo",
        ] + (["delegate_task"] if __import__("os").environ.get("WEBMAKER_HERMES_ENABLE_DELEGATION") == "1" else []),
        "includes": [],
    },
}

_RUNTIME_TOOLSETS: Set[str] = set()


def _is_allowed_toolset(name: str) -> bool:
    return name in CLI_ONLY_TOOLSETS or name in _RUNTIME_TOOLSETS


def get_toolset(name: str) -> Optional[Dict[str, Any]]:
    """Get a toolset definition by name."""
    if not _is_allowed_toolset(name):
        return None

    toolset = TOOLSETS.get(name)

    try:
        from tools.registry import registry
    except Exception:
        return toolset if toolset else None

    if toolset:
        merged_tools = sorted(
            set(toolset.get("tools", []))
            | set(registry.get_tool_names_for_toolset(name))
        )
        return {**toolset, "tools": merged_tools}

    return None


def resolve_toolset(name: str, visited: Set[str] = None) -> List[str]:
    """Recursively resolve a toolset to get all tool names."""
    if visited is None:
        visited = set()

    if name in {"all", "*"}:
        all_tools: Set[str] = set()
        for toolset_name in get_toolset_names():
            resolved = resolve_toolset(toolset_name, visited.copy())
            all_tools.update(resolved)
        return sorted(all_tools)

    if name in visited:
        return []

    visited.add(name)

    toolset = get_toolset(name)
    if not toolset:
        return []

    tools = set(toolset.get("tools", []))

    for included_name in toolset.get("includes", []):
        included_tools = resolve_toolset(included_name, visited)
        tools.update(included_tools)

    return sorted(tools)


def resolve_multiple_toolsets(toolset_names: List[str]) -> List[str]:
    """Resolve multiple toolsets and combine their tools."""
    all_tools = set()

    for name in toolset_names:
        if not _is_allowed_toolset(name):
            continue
        tools = resolve_toolset(name)
        all_tools.update(tools)

    return sorted(all_tools)


def get_all_toolsets() -> Dict[str, Dict[str, Any]]:
    """Get all available toolsets with their definitions."""
    result: Dict[str, Dict[str, Any]] = {}
    for name in sorted(CLI_ONLY_TOOLSETS | _RUNTIME_TOOLSETS):
        toolset = get_toolset(name)
        if toolset:
            result[name] = toolset
    return result


def get_toolset_names() -> List[str]:
    """Get names of all available toolsets."""
    return sorted(CLI_ONLY_TOOLSETS | _RUNTIME_TOOLSETS)


def validate_toolset(name: str) -> bool:
    """Check if a toolset name is valid."""
    if name in {"all", "*"}:
        return True
    return _is_allowed_toolset(name)


def create_custom_toolset(
    name: str,
    description: str,
    tools: List[str] = None,
    includes: List[str] = None,
) -> None:
    """Create a custom toolset at runtime."""
    TOOLSETS[name] = {
        "description": description,
        "tools": tools or [],
        "includes": includes or [],
    }
    _RUNTIME_TOOLSETS.add(name)


def get_toolset_info(name: str) -> Dict[str, Any]:
    """Get detailed information about a toolset including resolved tools."""
    toolset = get_toolset(name)
    if not toolset:
        return None

    resolved_tools = resolve_toolset(name)

    return {
        "name": name,
        "description": toolset["description"],
        "direct_tools": toolset["tools"],
        "includes": toolset["includes"],
        "resolved_tools": resolved_tools,
        "tool_count": len(resolved_tools),
        "is_composite": bool(toolset["includes"]),
    }
