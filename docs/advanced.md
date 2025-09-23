# Advanced Coda Usage

This guide covers advanced features and customization options for power users.

## Custom Agent Instructions

### Project-Specific Instructions

Create detailed instructions in `AGENTS.md` to guide Coda's behavior for your specific project:

```markdown
# My Project Agent Instructions

## Project Overview
This is a FastAPI-based microservice for user authentication with JWT tokens.

## Architecture
- `src/api/` - REST API endpoints
- `src/models/` - Pydantic models and database schemas
- `src/auth/` - Authentication logic
- `src/utils/` - Utility functions
- `tests/` - Test suite with pytest

## Coding Standards
- Use type hints for all functions
- Follow FastAPI patterns for dependency injection
- Use Pydantic models for request/response validation
- Include comprehensive docstrings
- Maintain 90%+ test coverage

## Database
- Uses SQLAlchemy with async support
- Alembic for migrations
- PostgreSQL in production, SQLite for tests

## Testing
- Run tests with: `pytest tests/`
- Use factories for test data
- Mock external services
- Test both success and error cases

## Deployment
- Uses Docker containers
- Environment variables for config
- Health checks on `/health` endpoint
```

### Global Instructions

Add global preferences to your config file at `~/.coda/config.toml`:

```toml
[instructions]
always_add_tests = true
prefer_async = true
include_error_handling = true
use_type_hints = true
```

## Model Configuration

### Choosing Models

Configure different models for different use cases:

```toml
# Main model for coding tasks
model = "gpt-4o"

# Alternative models
[models]
fast = "gpt-4o-mini"      # For quick questions
reasoning = "o1-preview"   # For complex logic
code = "gpt-4o"           # For code generation
```

### Reasoning Effort

Adjust reasoning effort based on task complexity:

```python
# In your requests, you can specify:
"/model gpt-4o reasoning=high"  # For complex debugging
"/model gpt-4o-mini reasoning=low"  # For simple tasks
```

## Advanced Approval System

### Fine-grained Permissions

Configure detailed approval settings:

```toml
[approvals]
# File operations
read = true
write = false
delete = false

# Shell operations
shell_read_only = true    # ls, cat, grep, etc.
shell_write = false       # mkdir, rm, mv, etc.
shell_install = false     # pip, npm, apt, etc.
shell_git = true          # git commands

# Network operations
web_requests = false      # curl, wget, etc.
api_calls = true          # For AI model calls

# System operations
process_management = false # kill, ps, etc.
environment_vars = false   # export, env, etc.
```

### Path-based Permissions

Restrict operations to specific directories:

```toml
[permissions.paths]
allow_read = [
    "src/",
    "tests/",
    "docs/",
    "*.md",
    "*.json",
    "*.toml"
]

allow_write = [
    "src/",
    "tests/",
    "docs/"
]

deny_write = [
    ".git/",
    "*.env",
    "secrets.json"
]
```

## Custom Evaluation and Testing

### Evaluation Scripts

Create evaluation scripts to test Coda's performance:

```python
# evals/test_code_generation.py
import pytest
from coda.core.agent import CodaAgent

async def test_function_generation():
    """Test that Coda can generate correct functions."""
    agent = CodaAgent()

    prompt = "Create a function to validate email addresses"
    response = await agent.process_message(prompt)

    # Extract generated code
    code = extract_code_blocks(response)

    # Test the generated function
    exec(code)
    assert validate_email("test@example.com") == True
    assert validate_email("invalid-email") == False

async def test_bug_fixing():
    """Test that Coda can fix bugs correctly."""
    buggy_code = """
def calculate_average(numbers):
    return sum(numbers) / len(numbers)
    """

    agent = CodaAgent()
    response = await agent.process_message(
        f"Fix this bug that crashes on empty lists:\n{buggy_code}"
    )

    # Verify the fix handles edge cases
    fixed_code = extract_code_blocks(response)
    exec(fixed_code)
    assert calculate_average([]) == 0  # Should not crash
    assert calculate_average([1, 2, 3]) == 2
```

### Performance Benchmarks

Monitor Coda's performance over time:

```python
# evals/benchmark.py
import time
import asyncio
from coda.core.agent import CodaAgent

async def benchmark_response_time():
    """Benchmark response times for different task types."""
    agent = CodaAgent()

    tasks = [
        "What does this function do: def fib(n): return n if n < 2 else fib(n-1) + fib(n-2)",
        "Create a simple REST API endpoint",
        "Debug this error: TypeError: unsupported operand type(s)",
        "Refactor this class to use composition instead of inheritance"
    ]

    for task in tasks:
        start = time.time()
        response = await agent.process_message(task)
        duration = time.time() - start

        print(f"Task: {task[:50]}...")
        print(f"Duration: {duration:.2f}s")
        print(f"Response length: {len(response)} chars")
        print("-" * 50)
```

## Integration with Development Tools

### Git Hooks

Set up git hooks to use Coda for automated tasks:

```bash
# .git/hooks/pre-commit
#!/bin/bash
# Use Coda to fix linting issues before commit

uv run coda --non-interactive "Fix any linting issues in staged files"
```

### IDE Integration

Create IDE plugins or scripts:

```python
# ide_plugin.py
import subprocess
import json

def ask_coda(question, file_context=None):
    """Ask Coda a question with optional file context."""
    cmd = ["uv", "run", "coda", "--json", "--question", question]

    if file_context:
        cmd.extend(["--context", file_context])

    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)

# Usage in IDE:
# response = ask_coda("Explain this function", current_file_content)
```

### CI/CD Integration

Use Coda in your CI/CD pipeline:

```yaml
# .github/workflows/coda-review.yml
name: Coda Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  coda-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python and uv
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install uv
        run: pip install uv

      - name: Install Coda
        run: uv sync

      - name: Run Coda Review
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          uv run coda --non-interactive \
            "Review the changes in this PR and suggest improvements" \
            --output review.md

      - name: Post Review Comment
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review.md', 'utf8');

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🤖 Coda Review\n\n${review}`
            });
```

## Extending Coda

### Custom Actions

Add custom actions to Coda:

```python
# custom_actions.py
from coda.core.executor import ActionExecutor

class CustomExecutor(ActionExecutor):
    def deploy_to_staging(self, service_name: str):
        """Deploy a service to staging environment."""
        command = f"kubectl apply -f deployments/{service_name}.yaml"
        return self.execute_shell(command)

    def run_security_scan(self, target_dir: str):
        """Run security scan on code."""
        command = f"bandit -r {target_dir} -f json"
        stdout, stderr, code = self.execute_shell(command)

        if code == 0:
            import json
            results = json.loads(stdout)
            return f"Security scan completed. Found {len(results['results'])} issues."
        else:
            return f"Security scan failed: {stderr}"
```

### Custom Models

Integrate with other AI models:

```python
# custom_models.py
from coda.core.models import LLMClient

class AnthropicClient(LLMClient):
    """Client for Anthropic's Claude models."""

    def __init__(self, config):
        super().__init__(config)
        import anthropic
        self.client = anthropic.Anthropic(api_key=config.anthropic_api_key)

    async def generate_response(self, messages, system_prompt=None):
        response = self.client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=4000,
            messages=messages,
            system=system_prompt
        )
        return response.content[0].text
```

## Performance Optimization

### Caching

Implement response caching for repeated queries:

```toml
[cache]
enabled = true
ttl = 3600  # 1 hour
max_size = 1000  # Maximum cached responses
```

### Parallel Processing

For multiple file operations:

```python
async def process_multiple_files(agent, file_list):
    """Process multiple files in parallel."""
    tasks = []
    for file_path in file_list:
        task = agent.process_message(f"Analyze {file_path}")
        tasks.append(task)

    results = await asyncio.gather(*tasks)
    return results
```

### Memory Management

Configure memory usage for large projects:

```toml
[memory]
max_context_size = 100000  # Characters
max_history_length = 50    # Messages
cleanup_threshold = 0.8    # Cleanup when 80% full
```