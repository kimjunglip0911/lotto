# Cursor hooks (Windows)

## 현재 구성

| 이벤트 | 스크립트 | 동작 |
|:---|:---|:---|
| `sessionStart` | `inject-rules-on-session-start.ps1` | `.cursor/rules` 전문( `01.pln-doc.mdc` 포함)을 대화 시작 시 1회 주입 |

`preToolUse` / `postToolUse`는 사용하지 않습니다.

- 플랜 양식: 규칙 `01.pln-doc.mdc` + `sessionStart` 주입으로 안내
- CreatePlan 차단·SwitchMode 안내: Cursor matcher/`postToolUse` 한계로 훅 대신 rules에 맡김

## 백업

- 예전 3이벤트 설정: `.cursor/hooks.json.bak`
- 미사용 스크립트(참고용): `enforce-plan-template.ps1`, `_hook-stdin.ps1`

## 검증

1. `hooks.json` 저장 후 Cursor 재시작
2. **Hooks** 탭: `sessionStart`만 있고 오류 없음
3. 새 채팅: `[SESSION RULES AUTO-LOADED]` 또는 rules 주입 확인

## 수동 테스트 (sessionStart)

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .cursor/hooks/inject-rules-on-session-start.ps1
```

stdout에 `additional_context`가 담긴 JSON 한 줄이 나오면 정상입니다.
