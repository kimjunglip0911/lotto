[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Output '{
  "permission": "deny",
  "user_message": "CreatePlan 도구가 차단되었습니다. 플랜은 .cursor/plans/개발설계서.md 파일에 직접 작성해야 합니다.",
  "agent_message": "CreatePlan 도구 사용 금지. Write 도구를 사용하여 .cursor/plans/개발설계서.md 파일에 .cursor/rules/01.plan-document-form.mdc 의 ## 1.~## 6. 양식으로 직접 작성하세요."
}'
exit 0
