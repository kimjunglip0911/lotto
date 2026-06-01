import { recommendApiUrl } from '@/app/recommend/api/core/url';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { isGeneratedSet } from '@/app/recommend/helpers/validators';

/**
 * 이 파일은 추천 번호 세트를 서버에 저장 요청하고, 서버 응답을 안전한 배열 형태로 검증한다.
 * - 입력: 서버 주소와 저장할 회차/룰/제외번호/세트 묶음을 받는다.
 * - 출력: 검증을 통과한 저장 결과 세트 배열을 돌려준다.
 * - 역할 분리: 주소 조합은 URL 유틸에서, 세트 생성 계산은 로직 파이프라인에서 담당한다.
 * - 실패 영향: 서버 저장 실패 또는 응답 형식 오류가 나면 즉시 예외를 던져 상위 흐름이 잘못된 결과를 쓰지 않게 막는다.
 */

type SaveSet = GeneratedSet & {
  applied_rule_ids: string[];
  excluded_numbers: number[];
};

type SavePayload = {
  drawNo: number;
  appliedRuleIds: string[];
  excludedNumbers: number[];
  sets: SaveSet[];
};

const buildBody = (payload: SavePayload) => ({
  draw_no: payload.drawNo,
  applied_rule_ids: payload.appliedRuleIds,
  excluded_numbers: payload.excludedNumbers,
  sets: payload.sets,
});

const parseSavedSets = (value: unknown): GeneratedSet[] => {
  if (!Array.isArray(value) || !value.every(isGeneratedSet)) {
    throw new Error('Generate and save response is invalid');
  }
  return value;
};

export const generateAndSaveSets = async (
  apiUrl: string,
  payload: SavePayload,
): Promise<GeneratedSet[]> => {
  const response = await fetch(recommendApiUrl('/api/recommend/generate-and-save', apiUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody(payload)),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate and save sets: ${response.status}`);
  }

  const generatedData: unknown = await response.json();
  return parseSavedSets(generatedData);
};
