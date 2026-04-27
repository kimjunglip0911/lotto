$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$rulesDir = Join-Path $repoRoot ".cursor\rules"

function Emit-EmptyContext {
  @{ additional_context = "" } | ConvertTo-Json -Compress
  exit 0
}

function Is-DocumentPath([string]$pathValue) {
  if ([string]::IsNullOrWhiteSpace($pathValue)) { return $false }
  $normalized = $pathValue.Replace("/", "\")
  if ($normalized -match "\\.cursor\\rules\\") { return $true }
  return $normalized -match "\.(md|mdc|mdx|txt)$"
}

function ShouldInjectByPatch([string]$patchText) {
  if ([string]::IsNullOrWhiteSpace($patchText)) { return $false }
  $matches = [regex]::Matches($patchText, '^\*\*\* (?:Add|Update) File: (.+)$', [System.Text.RegularExpressions.RegexOptions]::Multiline)
  foreach ($match in $matches) {
    if (Is-DocumentPath $match.Groups[1].Value.Trim()) {
      return $true
    }
  }
  return $false
}

function ShouldInjectForPreToolUse {
  try {
    $stdinRaw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($stdinRaw)) {
      # 세션 시작 훅은 stdin 페이로드가 없는 경우가 많아서 기본 주입한다.
      return $true
    }

    $payload = $stdinRaw | ConvertFrom-Json -ErrorAction Stop
    $toolName = [string]$payload.tool_name
    if ([string]::IsNullOrWhiteSpace($toolName)) {
      $toolName = [string]$payload.toolName
    }
    $arguments = $payload.tool_input
    if ($null -eq $arguments) {
      $arguments = $payload.arguments
    }

    if ($toolName -eq "CreatePlan") { return $true }

    if ($null -eq $arguments) { return $false }

    if (Is-DocumentPath ([string]$arguments.path)) { return $true }
    if (Is-DocumentPath ([string]$arguments.target_notebook)) { return $true }
    if (Is-DocumentPath ([string]$arguments.target_file)) { return $true }
    if (Is-DocumentPath ([string]$arguments.file_path)) { return $true }
    if (Is-DocumentPath ([string]$arguments.downloadPath)) { return $true }

    $commandText = [string]$arguments.command
    if ($commandText -match "CreatePlan" -or $commandText -match "\.mdc?\b" -or $commandText -match "\.mdx\b") {
      return $true
    }

    $patchText = [string]$arguments.patch
    if (ShouldInjectByPatch $patchText) { return $true }

    return $false
  }
  catch {
    # 페이로드를 해석하지 못하면 과도한 주입을 막기 위해 비활성화한다.
    return $false
  }
}

if (-not (ShouldInjectForPreToolUse)) {
  Emit-EmptyContext
}

if (-not (Test-Path $rulesDir)) {
  Emit-EmptyContext
}

$orderedRuleFiles = @(
  "rules.mdc",
  "skill-list.mdc",
  "project-structure.mdc",
  "components.mdc",
  "refactoring-guide.mdc",
  "bug-lessons.mdc",
  "git-commit-guide.mdc",
  "01.plan-document-form.mdc"
)

$existingOrdered = $orderedRuleFiles |
  ForEach-Object { Join-Path $rulesDir $_ } |
  Where-Object { Test-Path $_ }

$otherRules = Get-ChildItem -Path $rulesDir -File -Filter "*.mdc" |
  Where-Object { $existingOrdered -notcontains $_.FullName } |
  Sort-Object Name |
  Select-Object -ExpandProperty FullName

$allRules = @($existingOrdered + $otherRules)

# 세션 시작 시 rules 전문을 컨텍스트에 주입한다.
$sections = foreach ($rulePath in $allRules) {
  $fileName = [System.IO.Path]::GetFileName($rulePath)
  $content = Get-Content -Path $rulePath -Raw -Encoding UTF8

  @"
### .cursor/rules/$fileName
$content
"@
}

$context = @"
[SESSION RULES AUTO-LOADED]
아래 규칙을 세션 시작 시 자동 주입했다. 이후 작업에서 우선 준수한다.

$($sections -join "`n`n")
"@

@{ additional_context = $context } | ConvertTo-Json -Compress -Depth 5
exit 0
