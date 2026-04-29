# Prompt Master Skill

Prompt Master is a Claude skill that generates tool-specific, copy-ready prompts using a structured intent extraction and routing engine.

It runs fully in prompt space:

- no backend
- no database
- no build step

## Package Contents

- `SKILL.md`
- `references/template-architectures.md`
- `references/credit-killing-patterns.md`

## Install / Use

### Method 1: Upload ZIP to Claude.ai

1. Zip the `prompt-master` directory.
2. In Claude.ai, open Skills and upload the ZIP.
3. Start a chat and invoke Prompt Master naturally or via slash prefix.

### Method 2: Clone into Claude skills directory

1. Copy or clone this folder into your local Claude skills directory.
2. Restart Claude (if required by your environment) so the skill is indexed.
3. Invoke in any new chat.

## Use in Cursor (Both Methods)

Prompt Master can also be installed as a Cursor skill.

### Method 1: Project-only install (recommended)

Use this when you want the skill available only inside one repo.

1. Create this folder in your project:
   - `.cursor/skills/prompt-master/`
2. Copy these files:
   - `.cursor/skills/prompt-master/SKILL.md`
   - `.cursor/skills/prompt-master/references/template-architectures.md`
   - `.cursor/skills/prompt-master/references/credit-killing-patterns.md`
3. Reload Cursor:
   - `Cmd+Shift+P` -> `Developer: Reload Window`
4. Start a new chat and invoke naturally.

### Method 2: Global install (all projects)

Use this when you want the skill available across all projects for your user account.

1. Create this folder:
   - `~/.cursor/skills/prompt-master/`
2. Copy the same three files:
   - `~/.cursor/skills/prompt-master/SKILL.md`
   - `~/.cursor/skills/prompt-master/references/template-architectures.md`
   - `~/.cursor/skills/prompt-master/references/credit-killing-patterns.md`
3. Reload Cursor:
   - `Cmd+Shift+P` -> `Developer: Reload Window`
4. Open a new chat and test with:
   - `Write me a prompt for Cursor to refactor an auth module`

Important:

- Do not place custom skills in `~/.cursor/skills-cursor/` (reserved for built-in/internal skills).

## Invocation Styles

### Natural invocation

Use plain language:

- "Write me a prompt for Cursor to refactor an auth module."
- "I need a Gemini prompt for grounded market research."

### Slash command prefix

- `/prompt-master <request>`

Examples:

- `/prompt-master Write a DALL-E prompt for a cinematic product hero shot.`
- `/prompt-master Build a Devin task prompt to fix flaky CI tests.`

### Repair mode

Improve a bad prompt:

- `/prompt-master repair: <paste prompt>`
- "Fix this prompt for GPT-4.1 and make it cheaper and more reliable: <prompt>"

### Decompiler mode

Break down and adapt a prompt:

- `/prompt-master decompile: <paste prompt>`
- "Decompile this prompt and port it from Claude to Cursor."
- "Split this monolithic prompt into a clean sequence."

## Invocation Modes Explained

All four invocation styles use the same underlying skill engine, but each one enters a different operating mode.

- Natural prompt
  - Use plain language without a prefix.
  - What it does: runs standard prompt generation from your request.
  - Example: "Write me a prompt for Cursor to refactor an auth module."

- `/prompt-master ...`
  - Explicitly calls the skill through a slash command.
  - What it does: same generation behavior as natural invocation, but with explicit deterministic skill routing.
  - Example: `/prompt-master Write me a prompt for Cursor to refactor an auth module`

- Repair mode
  - Use when you already have a prompt and want it fixed.
  - What it does: preserves original intent, diagnoses weaknesses, and outputs a repaired prompt.
  - Example: `/prompt-master repair: <paste prompt>`

- Decompiler mode
  - Use when you need to analyze, port, or split an existing prompt.
  - What it does: breaks the prompt into components, can adapt it for a different tool, and can split monolithic prompts into a clean sequence.
  - Example: `/prompt-master decompile: <paste prompt>`

Quick mapping:

- Natural = create new prompt from scratch
- `/prompt-master` = create new prompt with explicit skill invocation
- Repair = fix an existing prompt
- Decompile = reverse-engineer/adapt/split an existing prompt

## Expected Output Contract

Prompt Master returns:

1. one copyable fenced prompt block
2. one metadata line: `Target: <tool> | Strategy: <brief note>`
3. optional setup notes only when genuinely needed

It does not expose internal framework names or template labels.

## Behavior Guarantees

- Silent extraction of nine intent dimensions before writing.
- Up to three clarifying questions only when critical information is missing.
- Deterministic routing to tool-specific guidance.
- Automatic removal of Chain of Thought instructions for reasoning-native models (`o1`, `o3`, `o4-mini`, `DeepSeek-R1`, `Qwen3`).
- Mandatory verification gate before output.
- Multi-turn memory block carried forward as explicit `Context` for consistency.

## End-to-End Smoke Test

Use this test message after loading the skill:

`Write me a prompt for Cursor to refactor an auth module`

Pass criteria:

- output is a single copyable prompt block
- prompt is file-scoped and tool-specific for Cursor
- metadata line is present and concise
