param(
  [Parameter()]
  [ValidateSet('Inject', 'Validate')]
  [string]$Mode = 'Inject'
)

$ErrorActionPreference = 'Stop'

function Emit-Allow {
  @{ permission = 'allow' } | ConvertTo-Json -Compress -Depth 5
  exit 0
}

function Emit-Deny {
  param(
    [string]$UserMessage,
    [string]$AgentMessage
  )

  @{
    permission = 'deny'
    user_message = $UserMessage
    agent_message = $AgentMessage
  } | ConvertTo-Json -Compress -Depth 5
  exit 0
}

function Emit-Context([string]$Context) {
  @{ additional_context = $Context } | ConvertTo-Json -Compress -Depth 5
  exit 0
}

function Emit-EmptyContext {
  Emit-Context ''
}

if (-not [Console]::IsInputRedirected) {
  if ($Mode -eq 'Validate') { Emit-Allow } else { Emit-EmptyContext }
}

$rawInput = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($rawInput)) {
  if ($Mode -eq 'Validate') { Emit-Allow } else { Emit-EmptyContext }
}

if ($Mode -eq 'Inject') {
  $isSwitchToPlan =
    ($rawInput -match '"(toolName|tool_name|name)"\s*:\s*"(SwitchMode|switchMode|switch_mode)"') -and
    ($rawInput -match '"(target_mode_id|targetModeId|mode)"\s*:\s*"plan"')

  $isCreatePlan =
    $rawInput -match '"(toolName|tool_name|name)"\s*:\s*"(CreatePlan|createPlan|create_plan)"'

  if (-not ($isSwitchToPlan -or $isCreatePlan)) {
    Emit-EmptyContext
  }

  $context = @"
[PLAN TEMPLATE ENFORCEMENT]
플랜 모드에서는 플랜 문서를 작성할 때 반드시 `.cursor/rules/01.pln-doc.mdc` 양식(섹션 구조/헤더/Step 형식)을 그대로 따른다.
간소화·요약본으로 대체하지 않고 원본 양식 순서를 유지한다.
"@
  Emit-Context $context
}

$inputObj = $null
try {
  $inputObj = $rawInput | ConvertFrom-Json
}
catch {
  Emit-Allow
}

$toolName = ''
if ($null -ne $inputObj.toolName) {
  $toolName = [string]$inputObj.toolName
}
elseif ($null -ne $inputObj.tool_name) {
  $toolName = [string]$inputObj.tool_name
}
elseif ($null -ne $inputObj.name) {
  $toolName = [string]$inputObj.name
}

if ($toolName -notmatch '^(CreatePlan|createPlan|create_plan)$') { Emit-Allow }

$planText = ''
if ($null -ne $inputObj.arguments) {
  if ($null -ne $inputObj.arguments.plan) {
    $planText = [string]$inputObj.arguments.plan
  }
  elseif ($null -ne $inputObj.arguments.content) {
    $planText = [string]$inputObj.arguments.content
  }
}

if ([string]::IsNullOrWhiteSpace($planText)) {
  Emit-Deny -UserMessage 'Plan body is empty. Please follow .cursor/rules/01.pln-doc.mdc.' -AgentMessage 'Blocked CreatePlan because plan content was empty.'
}

$requiredChecks = @(
  @{ Label = 'section1'; Pattern = '(?m)^##\s*1\..+$' },
  @{ Label = 'section2'; Pattern = '(?m)^##\s*2\..+$' },
  @{ Label = 'section3'; Pattern = '(?m)^##\s*3\..+$' },
  @{ Label = 'section4'; Pattern = '(?m)^##\s*4\..+$' },
  @{ Label = 'section5'; Pattern = '(?m)^##\s*5\..+$' },
  @{ Label = 'summarySubtitle'; Pattern = '(?m)^###\s*.+$' },
  @{ Label = 'summaryBullet1'; Pattern = '(?m)^-\s+\*\*.+\*\*:\s*.+$' },
  @{ Label = 'summaryBullet2'; Pattern = '(?m)^-\s+\*\*.+\*\*:\s*.+$(?:[\r\n]+(?!-\s+\*\*.+\*\*:).*)*[\r\n]+-\s+\*\*.+\*\*:\s*.+$' },
  @{ Label = 'detailSubtitle'; Pattern = '(?m)^###\s*.*\(.*\)\s*$' },
  @{ Label = 'detailItem'; Pattern = '(?m)^\d+\.\s+\*\*.+\*\*:\s*`?\[?[^\]\r\n]+(\]|`)?' },
  @{ Label = 'riskItem'; Pattern = '(?m)^\d+\.\s+\*\*.+\*\*:\s*`?\[?[^\]\r\n]+(\]|`)?' },
  @{ Label = 'riskBullet1'; Pattern = '(?m)^\s*-\s+\*\*.+\*\*:\s*.+$' },
  @{ Label = 'riskBullet2'; Pattern = '(?m)^\s*-\s+\*\*.+\*\*:\s*.+$(?:[\r\n]+(?!\s*-\s+\*\*.+\*\*:).*)*[\r\n]+\s*-\s+\*\*.+\*\*:\s*.+$' },
  @{ Label = 'stackCategory1'; Pattern = '(?m)^1\.\s+\*\*.+\*\*\s*$' },
  @{ Label = 'stackCategory2'; Pattern = '(?m)^2\.\s+\*\*.+\*\*\s*$' },
  @{ Label = 'stackCategory3'; Pattern = '(?m)^3\.\s+\*\*.+\*\*\s*$' },
  @{ Label = 'stackCategory4'; Pattern = '(?m)^4\.\s+\*\*.+\*\*\s*$' },
  @{ Label = 'stackBullet'; Pattern = '(?m)^\s*-\s+\S.+' },
  @{ Label = 'stepTitle'; Pattern = '(?m)^###\s*Step\s+\d+\.\s+.+$' },
  @{ Label = 'stepFieldFile'; Pattern = '(?m)^-\s+\*\*.+\*\*:\s*`[^`\r\n]+`' },
  @{ Label = 'stepFieldType'; Pattern = '(?m)^-\s+\*\*.+\*\*:\s+\[(NEW|MODIFY|DELETE)\]' },
  @{ Label = 'stepFieldChanges'; Pattern = '(?m)^-\s+\*\*.+\*\*:\s*$' },
  @{ Label = 'stepDetailBullet'; Pattern = '(?m)^\s{2}-\s+\S.+' }
)

$missing = @()
foreach ($check in $requiredChecks) {
  if ($planText -notmatch $check.Pattern) {
    $missing += $check.Label
  }
}

if ($missing.Count -gt 0) {
  $missingText = ($missing -join ', ')
  Emit-Deny `
    -UserMessage '플랜 형식이 01.pln-doc.mdc와 달라 차단했습니다. 필수 섹션/소제목/Step 필드를 모두 포함해 다시 작성해 주세요.' `
    -AgentMessage ("Template validation failed. Missing checks: {0}" -f $missingText)
}

Emit-Allow
