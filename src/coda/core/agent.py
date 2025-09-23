"""Main agent orchestration for Coda."""

import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

from coda.core.config import CodaConfig
from coda.core.models import LLMClient
from coda.core.executor import ActionExecutor


class CodaAgent:
    """Main Coda agent that orchestrates task execution."""

    def __init__(self, config: CodaConfig, workspace: Optional[Path] = None):
        self.config = config
        self.workspace = workspace or Path.cwd()
        self.llm = LLMClient(config)
        self.executor = ActionExecutor(config, self.workspace)
        self.conversation_history: List[Dict[str, str]] = []

    async def process_message(self, message: str) -> str:
        """Process a user message and return a response."""
        # Handle special commands
        if message.startswith("/"):
            return await self._handle_command(message)

        # Add to conversation history
        self.conversation_history.append({"role": "user", "content": message})

        # Generate response
        system_prompt = self._get_system_prompt()
        response = await self.llm.generate_response(
            self.conversation_history,
            system_prompt,
        )

        # Add response to history
        self.conversation_history.append({"role": "assistant", "content": response})

        # Parse and execute any actions in the response
        actions = self._parse_actions(response)
        if actions:
            action_results = await self._execute_actions(actions)
            if action_results:
                response += "\n\n" + action_results

        return response

    async def _handle_command(self, command: str) -> str:
        """Handle special commands like /status, /model, etc."""
        if command == "/status":
            return self._get_status()
        elif command == "/init":
            return await self._create_agents_file()
        elif command.startswith("/model"):
            return self._handle_model_command(command)
        elif command == "/approvals":
            return self._get_approvals_info()
        else:
            return f"Unknown command: {command}"

    def _get_status(self) -> str:
        """Get current session status."""
        git_info = self.executor.git_status()
        return f"""**Session Status**

**Model:** {self.config.model}
**Workspace:** {self.workspace}
**Git Branch:** {git_info.get('branch', 'unknown')}
**Git Status:** {'clean' if not git_info.get('is_dirty', True) else 'dirty'}

**Approvals:**
- Read files: {self.config.auto_approve_read}
- Write files: {self.config.auto_approve_write}
- Shell commands: {self.config.auto_approve_shell}
- Install packages: {self.config.auto_approve_install}
"""

    async def _create_agents_file(self) -> str:
        """Create an AGENTS.md file with instructions."""
        content = """# Coda Agent Instructions

This file contains instructions for the Coda AI coding agent.

## Agent Capabilities

- Read and write files
- Execute shell commands
- Install dependencies
- Git operations
- Code generation and editing

## Approval Settings

Configure what the agent can do automatically in `~/.coda/config.toml`:

```toml
[approvals]
read = true     # Auto-approve file reading
write = false   # Require approval for file writes
shell = false   # Require approval for shell commands
install = false # Require approval for package installation
```

## Usage Tips

1. Be specific about what you want to accomplish
2. Mention file paths when relevant
3. Ask for explanations if you need to understand the changes

## Example Commands

- "Add error handling to the login function"
- "Create a new API endpoint for user registration"
- "Fix the failing tests in test_auth.py"
- "Update the README with installation instructions"
"""

        try:
            self.executor.write_file(Path("AGENTS.md"), content)
            return "Created AGENTS.md file with Coda instructions."
        except Exception as e:
            return f"Error creating AGENTS.md: {e}"

    def _handle_model_command(self, command: str) -> str:
        """Handle model configuration command."""
        parts = command.split(maxsplit=1)
        if len(parts) == 1:
            return f"Current model: {self.config.model}\nUsage: /model <model_name>"

        new_model = parts[1]
        self.config.model = new_model
        return f"Model changed to: {new_model}"

    def _get_approvals_info(self) -> str:
        """Get information about approval settings."""
        return f"""**Approval Settings**

- Read files: {self.config.auto_approve_read}
- Write files: {self.config.auto_approve_write}
- Shell commands: {self.config.auto_approve_shell}
- Install packages: {self.config.auto_approve_install}

To change these settings, edit `~/.coda/config.toml` or use the config API.
"""

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the LLM."""
        return f"""You are Coda, an AI coding assistant. You help users with programming tasks in their workspace.

**Workspace:** {self.workspace}
**Capabilities:** Read/write files, execute shell commands, git operations, install dependencies

**When suggesting actions, use this format:**
- `[READ file_path]` to read a file
- `[WRITE file_path]` to write/update a file
- `[SHELL command]` to execute a shell command
- `[GIT action]` for git operations

**Rules:**
- Always explain what you're doing and why
- Ask for confirmation before making significant changes
- Be helpful but safe
- Focus on the specific task requested
"""

    def _parse_actions(self, response: str) -> List[Dict[str, str]]:
        """Parse actions from the LLM response."""
        actions = []

        # Look for action patterns like [READ file.py], [WRITE file.py], [SHELL ls]
        patterns = [
            (r'\[READ\s+([^\]]+)\]', 'read'),
            (r'\[write\s+([^\]]+)\]', 'write'),
            (r'\[shell\s+([^\]]+)\]', 'shell'),
            (r'\[git\s+([^\]]+)\]', 'git'),
        ]

        for pattern, action_type in patterns:
            matches = re.findall(pattern, response, re.IGNORECASE)
            for match in matches:
                actions.append({
                    'type': action_type,
                    'target': match.strip(),
                })

        return actions

    async def _execute_actions(self, actions: List[Dict[str, str]]) -> str:
        """Execute parsed actions."""
        results = []

        for action in actions:
            action_type = action['type']
            target = action['target']

            try:
                if action_type == 'read':
                    if self.config.auto_approve_read:
                        content = self.executor.read_file(Path(target))
                        results.append(f"Read {target} ({len(content)} chars)")
                    else:
                        results.append(f"[APPROVAL NEEDED] Read {target}")

                elif action_type == 'write':
                    if self.config.auto_approve_write:
                        results.append(f"[WRITE PLACEHOLDER] {target}")
                    else:
                        results.append(f"[APPROVAL NEEDED] Write {target}")

                elif action_type == 'shell':
                    if self.config.auto_approve_shell:
                        stdout, stderr, code = self.executor.execute_shell(target)
                        result = f"Executed: {target}\n"
                        if stdout:
                            result += f"Output: {stdout}\n"
                        if stderr:
                            result += f"Error: {stderr}\n"
                        results.append(result)
                    else:
                        results.append(f"[APPROVAL NEEDED] Shell: {target}")

                elif action_type == 'git':
                    results.append(f"[GIT PLACEHOLDER] {target}")

            except Exception as e:
                results.append(f"Error executing {action_type} {target}: {e}")

        return "\n".join(results) if results else ""