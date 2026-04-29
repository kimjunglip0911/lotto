# Credit-Killing Patterns and Repairs

Load this file only in repair mode or when quality degradation is detected.

Each pattern includes a bad snippet and a repaired snippet.

## 1) Vague Objective

Before: "Help with this."
After: "Task: Refactor auth module token validation for clarity and testability."

## 2) Missing Tool Target

Before: "Write a prompt to improve code."
After: "Target tool: Cursor. Produce a file-scoped refactor prompt."

## 3) Weak Constraints

Before: "Try not to break tests."
After: "MUST keep all existing tests passing; NEVER remove coverage."

## 4) Constraints Buried Late

Before: Constraints at end.
After: Put hard constraints in first 30% of prompt.

## 5) Ambiguous Output

Before: "Give me something useful."
After: "Output: one patch plan, one change list, one test checklist."

## 6) No Input Definition

Before: "Use the code."
After: "Input: files `auth/*`, failing test logs, and current lint errors."

## 7) No Success Criteria

Before: "Make it better."
After: "Success: reduced complexity, no behavior regressions, tests pass."

## 8) No Audience

Before: generic ask.
After: "Audience: senior backend engineers reviewing a PR."

## 9) Contradictory Tone and Goal

Before: "Be concise and exhaustive in 3 lines."
After: "Be concise; include only essential findings and actionable steps."

## 10) Overlong Persona

Before: 200-word roleplay intro.
After: one-line role assignment tied to task.

## 11) Prompt Chaining Request

Before: "Chain 8 prompts together."
After: single robust prompt with explicit staged sections.

## 12) Forbidden MoE

Before: "Use mixture of experts."
After: remove; keep allowed techniques only.

## 13) Forbidden Tree of Thought

Before: "Use tree of thought."
After: remove and replace with clear constraints + examples.

## 14) Forbidden Graph of Thought

Before: "Use graph-of-thought planning."
After: replace with deterministic step list.

## 15) Forbidden Universal Self-Consistency

Before: "Sample 20 paths and vote."
After: single-pass structured prompt with verification checklist.

## 16) CoT on Reasoning Model

Before: "o3: think step by step out loud."
After: remove CoT instruction; keep outcome-only directives.

## 17) Missing Grounding for Gemini

Before: generic ask to Gemini.
After: add source scope, citation expectation, and assumption handling.

## 18) Claude Implicit Fill

Before: "You know what to do."
After: explicit literal directives and exact output schema.

## 19) GPT Over-Scaffold

Before: deeply nested XML + long prose.
After: compact sections with direct constraints.

## 20) No File Scope for IDE

Before: "Refactor auth."
After: include exact files/modules and untouched boundaries.

## 21) Missing Stop Conditions (Agents)

Before: open-ended autonomy.
After: define stop conditions and max steps/time.

## 22) Missing Allowed/Forbidden Actions (Agents)

Before: no action policy.
After: explicit allowed and forbidden operations.

## 23) Missing Progress Checkpoints (Agents)

Before: no reporting cadence.
After: checkpoint every N steps with status and blockers.

## 24) Midjourney Without Visual Structure

Before: "Make it cool."
After: subject/composition/style/lighting/palette/lens/exclusions.

## 25) DALL-E Without Negative Constraints

Before: no exclusions.
After: include "NEVER include watermark/text artifacts."

## 26) ComfyUI Without Checkpoint Family

Before: prompt only.
After: ask SD 1.5 vs SDXL vs Flux first.

## 27) ComfyUI Single Block

Before: one mixed prompt.
After: separate Positive and Negative blocks.

## 28) Reference Edit Rewrites Scene

Before: full new scene description.
After: delta-only edits; preserve unchanged elements.

## 29) Unbounded Context Dump

Before: large irrelevant history.
After: compact explicit Context block with validated facts only.

## 30) Missing Examples When Needed

Before: abstract rules only.
After: add 1-2 targeted few-shot examples.

## 31) Passive Signal Verbs

Before: "should, might, consider."
After: "MUST, NEVER, REQUIRED."

## 32) Missing Failure Handling

Before: no fallback path.
After: add assumptions + clarification trigger.

## 33) No Clarification Limits

Before: endless questions.
After: ask max three critical questions.

## 34) Hidden Assumptions

Before: silent guessed dependencies.
After: explicit assumption line in metadata strategy note.

## 35) Non-Copyable Output

Before: mixed prose and prompt fragments.
After: single fenced prompt block only.

## 36) Metadata Missing

Before: prompt only.
After: add `Target: <tool> | Strategy: <brief note>`.

## 37) Verification Gate Skipped

Before: no final checks.
After: confirm tool target, early constraints, signal strength, forbidden-technique absence.
