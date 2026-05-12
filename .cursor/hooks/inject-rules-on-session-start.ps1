param(
  [Parameter()]
  [ValidateSet('Full', 'Index')]
  [string] $InjectMode = 'Full'
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$rulesDir = Join-Path $repoRoot ".cursor\rules"

function Emit-EmptyContext {
  @{ additional_context = "" } | ConvertTo-Json -Compress
  exit 0
}

function Emit-IndexOnly {
  # postToolUse는 JSON이 stdin으로 온다. 리다이렉트된 경우에만 읽어 파이프를 비운다.
  try {
    if ([Console]::IsInputRedirected) {
      $null = [Console]::In.ReadToEnd()
    }
  }
  catch {
    # 무시
  }

  if (-not (Test-Path $rulesDir)) {
    Emit-EmptyContext
  }

  $indexPath = Join-Path $rulesDir "index-md.mdc"
  if (-not (Test-Path $indexPath)) {
    Emit-EmptyContext
  }

  $content = Get-Content -Path $indexPath -Raw -Encoding UTF8
  $context = @"
[RULES INDEX — 도구 사용 직후 자동 주입]
작업을 이어가기 전에 아래 인덱스에 따라 `.cursor/rules`에서 해당 파일을 연다.

### .cursor/rules/index-md.mdc
$content
"@

  @{ additional_context = $context } | ConvertTo-Json -Compress -Depth 5
  exit 0
}

if ($InjectMode -eq 'Index') {
  Emit-IndexOnly
}

# Full: sessionStart 전용. stdin을 읽지 않는다(일부 실행 환경에서 ReadToEnd가 무한 대기할 수 있음).
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
