"""LLM integration for Coda agent."""

import json
from typing import List, Dict, Any, Optional

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from coda.core.config import CodaConfig


class LLMClient:
    """Client for interacting with language models."""

    def __init__(self, config: CodaConfig):
        self.config = config
        if OPENAI_AVAILABLE and config.openai_api_key:
            self.client = openai.OpenAI(api_key=config.openai_api_key)
        else:
            self.client = None

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
    ) -> str:
        """Generate a response from the LLM."""
        if not self.client:
            return "Error: OpenAI client not available. Please install openai and set OPENAI_API_KEY."

        try:
            # Prepare messages
            llm_messages = []
            if system_prompt:
                llm_messages.append({"role": "system", "content": system_prompt})

            llm_messages.extend(messages)

            # Make API call
            response = self.client.chat.completions.create(
                model=self.config.model,
                messages=llm_messages,
                temperature=0.1,
            )

            return response.choices[0].message.content or ""

        except Exception as e:
            return f"Error generating response: {e}"

    async def generate_code_edit(
        self,
        file_content: str,
        edit_request: str,
        file_path: str,
    ) -> str:
        """Generate a code edit for a specific file."""
        system_prompt = f"""You are a code editing assistant. You will be given:
1. The current content of a file
2. A request for what to change

Respond with the complete updated file content. Be precise and maintain existing code style.
File path: {file_path}"""

        messages = [
            {
                "role": "user",
                "content": f"Current file content:\n\n```\n{file_content}\n```\n\nEdit request: {edit_request}",
            }
        ]

        return await self.generate_response(messages, system_prompt)

    async def generate_shell_command(self, task_description: str, cwd: str) -> str:
        """Generate a shell command for a task."""
        system_prompt = f"""You are a shell command assistant. Generate safe shell commands for the given task.
Current working directory: {cwd}

Respond with only the command, no explanation."""

        messages = [
            {"role": "user", "content": f"Task: {task_description}"}
        ]

        return await self.generate_response(messages, system_prompt)