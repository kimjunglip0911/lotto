# Template Architectures Reference

Load this file only when template-level detail is needed.

## 1) RTF (Role, Task, Format)

Use when request is straightforward and target tool is known.

- Role: who the model should act as
- Task: concrete objective and boundaries
- Format: exact output structure

Skeleton:

```text
You are <role>.
Task: <objective>.
Constraints: <hard rules>.
Input: <provided material>.
Output format: <exact format>.
Success criteria: <checks>.
```

## 2) CO-STAR

Best for business/product requests requiring richer framing.

- Context
- Objective
- Style
- Tone
- Audience
- Response

Skeleton:

```text
Context: ...
Objective: ...
Style: ...
Tone: ...
Audience: ...
Response format: ...
Constraints: ...
```

## 3) RISEN

Best for conversion/execution prompts with clear sequencing.

- Role
- Instructions
- Steps
- End goal
- Narrowing

Skeleton:

```text
Role: ...
Instructions: ...
Steps:
1) ...
2) ...
End goal: ...
Narrowing constraints: ...
```

## 4) CRISPE

Best for prompts that need deep context and examples.

- Capacity
- Role
- Insight
- Statement
- Personality
- Experiment

Skeleton:

```text
Capacity: ...
Role: ...
Insight/Context: ...
Statement of task: ...
Personality/Tone: ...
Examples/Experiment setup: ...
Output schema: ...
```

## 5) Chain of Thought (Non-reasoning models only)

Use only for non-reasoning targets where intermediate reasoning structure helps reliability.

Never use for `o1`, `o3`, `o4-mini`, `DeepSeek-R1`, `Qwen3`.

Skeleton:

```text
Solve the task with clear internal reasoning discipline.
Do not reveal hidden reasoning unless explicitly requested.
Return only final answer in this format: ...
```

## 6) Few-Shot

Use when behavior calibration is easiest through examples.

Skeleton:

```text
Task: ...
Rules: ...
Example 1
Input: ...
Output: ...
Example 2
Input: ...
Output: ...
Now process:
Input: ...
Output:
```

## 7) File-Scope

Use for coding IDE assistants (Cursor/Windsurf/Copilot).

Required blocks:

- Objective
- File scope
- Constraints
- Implementation plan
- Validation/tests
- Deliverables

Skeleton:

```text
Objective: ...
File scope:
- path/a
- path/b
Constraints: ...
Plan before edit: REQUIRED.
Validation:
- run tests ...
- update docs ...
Deliverable format: patch summary + changed files.
```

## 8) ReAct

Use for agentic tasks requiring bounded tool use.

Skeleton:

```text
Goal: ...
Allowed actions: ...
Forbidden actions: ...
Stop conditions: ...
Checkpoint cadence: every N steps.
Output contract: status + evidence + next action.
```

## 9) Visual Descriptor

Use for image generation from scratch.

Required elements:

- subject
- composition
- environment
- style/medium
- lighting
- color palette
- camera/lens framing
- exclusions

Skeleton:

```text
Subject: ...
Composition: ...
Environment: ...
Style/Medium: ...
Lighting: ...
Color palette: ...
Camera/Lens: ...
Negative constraints: ...
```

## 10) Reference Image Editing

Use when user has an existing image and wants edits.

Rules:

- describe deltas only
- preserve unchanged elements
- never rewrite whole scene

Skeleton:

```text
Base image: provided by user.
Preserve: ...
Edit delta:
- change A ...
- change B ...
Do not alter: ...
Output: edited image prompt/instructions only.
```

## 11) ComfyUI

Use for node-based generation with model-specific behavior.

Always confirm checkpoint family if unknown: SD 1.5, SDXL, Flux.

Required output:

- Positive prompt block
- Negative prompt block

Skeleton:

```text
Checkpoint family: <required>
Positive:
...

Negative:
...
```

## 12) Prompt Decompiler

Use to reverse-engineer a prompt and adapt it.

Capabilities:

- component extraction
- weakness detection
- tool migration
- sequence splitting

Skeleton:

```text
Original prompt: ...
Extracted components:
- role
- objective
- constraints
- context
- output contract
Adapted prompt for <tool>: ...
Optional split sequence:
1) ...
2) ...
```

## 13) Opus 4.7 Task Brief (Literal-Mode Claude)

Use for literal-execution Claude workflows needing explicit operational controls.

Required sections:

- Mission
- Inputs
- Non-negotiable constraints
- Procedure
- Verification checklist
- Output contract

Skeleton:

```text
Mission: ...
Inputs: ...
Non-negotiables: ...
Procedure:
1) ...
2) ...
Verification checklist:
- ...
Output contract:
- ...
```

## Selection Guidance

- Default to smallest template that preserves reliability.
- Prefer File-Scope for IDE coding assistants.
- Prefer ReAct for autonomous agents.
- Prefer Visual Descriptor/Reference Edit/ComfyUI for image workflows.
- Use Prompt Decompiler for repair+porting/splitting requests.
