[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 프로젝트 루트 기준 상대 경로 (hooks는 프로젝트 루트에서 실행됨)
$rulePath = ".cursor/rules/01.plan-document-form.mdc"

$ruleContent = ""
if (Test-Path $rulePath) {
    $ruleContent = Get-Content $rulePath -Raw -Encoding UTF8
}

$agentMessage = @"
[훅 주입] CreatePlan 도구를 사용하기 전에 아래 양식을 반드시 확인하고, 플랜 본문을 ## 1. ~ ## 6. 구조로 작성하세요.

$ruleContent
"@

$response = [ordered]@{
    permission    = "allow"
    agent_message = $agentMessage
} | ConvertTo-Json -Depth 5 -Compress:$false

Write-Output $response
exit 0
