# Analysis Feature

JL 휠 기반 번호 생성/저장/중복 인사이트 분석을 담당합니다.

## 구성
- `page.tsx`: 분석 페이지 UI 엔트리
- `components/AnalysisController.tsx`: 생성/조회 컨트롤 UI
- `components/AnalysisResultList.tsx`: 세트 카드 리스트 렌더링
- `api/router.py`: `/api/analysis/*` 엔드포인트 (`generate/ai` 제외)
- `api/jl_service.py`: JL 시뮬레이션 로직 접근 레이어
- `api/queries.py`: 저장용 SQL
- `scripts/run_wheel_52.py`: 52회 테스트 실행 엔트리
- `scripts/당첨 이력.md`: 52회 테스트 결과 문서

