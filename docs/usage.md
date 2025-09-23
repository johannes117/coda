# Coda Usage Guide

This guide covers how to use Coda effectively for your coding tasks.

## Getting Started

Launch Coda in your project directory:

```bash
cd your-project
uv run coda
```

You'll see the welcome screen with the Tokyo Night-themed interface.

## Basic Commands

Coda supports several built-in commands:

- `/init` - Create an AGENTS.md file with project instructions
- `/status` - Show current session configuration
- `/approvals` - View and configure approval settings
- `/model` - Change the AI model or reasoning effort
- `/help` - Get help information

## Conversational Interface

Simply type your coding request in natural language:

### Examples

**File Operations:**
- "Read the main.py file and explain what it does"
- "Create a new function to validate email addresses"
- "Add error handling to the login function"

**Code Generation:**
- "Write a REST API endpoint for user registration"
- "Create unit tests for the authentication module"
- "Generate a requirements.txt file based on the imports"

**Debugging:**
- "Fix the bug in the calculate_total function"
- "Why is my test failing in test_auth.py?"
- "Optimize this slow database query"

**Project Management:**
- "Update the README with installation instructions"
- "Add logging to all the error cases"
- "Refactor the user model to use dataclasses"

## Understanding Responses

Coda's responses may include:

### Action Indicators

When Coda wants to perform actions, it will use these patterns:
- `[READ file.py]` - Wants to read a file
- `[WRITE file.py]` - Wants to write/update a file
- `[SHELL command]` - Wants to run a shell command
- `[GIT action]` - Wants to perform git operations

### Approval System

Depending on your configuration, Coda may:
- Automatically perform approved actions
- Ask for permission before risky operations
- Show `[APPROVAL NEEDED]` for restricted actions

## Keyboard Shortcuts

- `Enter` - Send message
- `Ctrl+J` - Insert newline in input
- `Ctrl+T` - Show transcript (planned feature)
- `t` - Toggle between dark and light themes
- `Escape` - Interrupt ongoing generation
- `Ctrl+C` - Quit application

## Working with Files

### File Reading
Coda can read and analyze any text file in your project:
- Source code files (.py, .js, .ts, etc.)
- Configuration files (.json, .yaml, .toml, etc.)
- Documentation files (.md, .rst, .txt, etc.)

### File Writing
Coda can create and modify files:
- Generate new code files
- Update existing functions
- Modify configuration files
- Create documentation

### Ignored Files
Files matching patterns in `.codaignore` or the config will be skipped:
- Binary files and logs
- Dependency directories (node_modules, .venv)
- Git and cache directories
- Sensitive files containing secrets

## Shell Integration

Coda can execute shell commands (with approval):
- Run tests: "Run the pytest suite"
- Install packages: "Add pytest as a dev dependency"
- Git operations: "Commit these changes with a good message"
- Build operations: "Build the project and fix any errors"

## Best Practices

### 1. Be Specific
Instead of: "Fix my code"
Try: "Fix the authentication bug in login.py line 45"

### 2. Provide Context
- Mention relevant file names
- Explain what you're trying to achieve
- Include error messages if applicable

### 3. Use Project Instructions
Create an `AGENTS.md` file (use `/init`) with:
- Project overview and architecture
- Coding standards and conventions
- Testing requirements
- Deployment instructions

### 4. Review Changes
- Always review code changes before committing
- Test functionality after modifications
- Understand the changes Coda makes

### 5. Iterative Approach
- Break complex tasks into smaller steps
- Test each change before proceeding
- Provide feedback on results

## Advanced Usage

### Custom Prompts
In your `AGENTS.md`, provide specific instructions:
```markdown
## Coding Standards
- Use type hints for all function parameters
- Follow PEP 8 style guidelines
- Include docstrings for public functions
- Write unit tests for new functionality

## Project Structure
- Models in src/models/
- API endpoints in src/api/
- Tests in tests/ with matching structure
```

### Multi-file Changes
Coda can coordinate changes across multiple files:
- "Refactor the user authentication to use JWT tokens"
- "Add API versioning to all endpoints"
- "Update the database schema and related models"

### Integration with Tools
Coda works well with:
- Version control (git)
- Package managers (uv, pip, npm)
- Testing frameworks (pytest, jest)
- Linters and formatters (ruff, black, prettier)

## Troubleshooting

### Common Issues

**Coda doesn't see my files**
- Check your `.codaignore` patterns
- Ensure files aren't in ignored directories
- Verify file permissions

**Actions aren't executing**
- Check approval settings with `/approvals`
- Look for `[APPROVAL NEEDED]` messages
- Enable auto-approval for trusted actions

**Poor code quality**
- Provide better context in your requests
- Create detailed project instructions in `AGENTS.md`
- Be specific about coding standards

**Performance issues**
- Use smaller, focused requests
- Break large tasks into steps
- Consider model settings with `/model`