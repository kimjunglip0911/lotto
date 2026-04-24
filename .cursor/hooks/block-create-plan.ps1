[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 프로젝트 루트 기준 상대 경로 (hooks는 프로젝트 루트에서 실행됨)
$rulePath = ".cursor/rules/01.plan-document-form.mdc"
$planPath = ".cursor/plans/개발설계서.md"

$ruleContent = ""
if (Test-Path $rulePath) {
    $ruleContent = Get-Content $rulePath -Raw -Encoding UTF8
}

$agentMessage = @"
[훅 차단] CreatePlan 도구 사용 금지.

대신 Write 도구를 사용하여 아래 경로에 직접 덮어쓰세요:
  파일: $planPath

아래는 반드시 따라야 할 양식 전문입니다. ## 1. ~ ## 6. 구조를 그대로 사용하세요:

$ruleContent
"@

$response = [ordered]@{
    permission   = "deny"
    user_message = "CreatePlan 도구가 차단되었습니다. 플랜은 $planPath 파일에 직접 작성됩니다."
    agent_message = $agentMessage
} | ConvertTo-Json -Depth 5 -Compress:$false

Write-Output $response
exit 0
