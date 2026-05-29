# 세션 시작 시 .cursor/rules 전문을 대화 컨텍스트에 넣는다.
# sessionStart 전용 — stdin을 읽지 않는다(빈 파이프에서 ReadToEnd가 멈출 수 있음).

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$rulesDir = Join-Path $repoRoot ".cursor\rules"

function Emit-EmptyContext {
  @{ additional_context = "" } | ConvertTo-Json -Compress
  exit 0
}
if (-not (Test-Path $rulesDir)) {
  Emit-EmptyContext
}

$orderedRuleFiles = @(
  "index-md.mdc",
  "rules.mdc",
  "skill-list.mdc",
  "project-structure.mdc",
  "components.mdc",
  "refactoring-guide.mdc",
  "bug-lessons.mdc",
  "git-commit-guide.mdc",
  "01.pln-doc.mdc",
  "02.dev-gd.mdc"
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
