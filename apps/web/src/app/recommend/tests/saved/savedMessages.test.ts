import { describe, expect, it } from 'vitest';
import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';
import {
  initialStatusMessage,
  savedEmptyMessage,
  savedErrorMessage,
  savedLoadingMessage,
  savedSuccessMessage,
} from '@/app/recommend/helpers/savedMessages';

describe('savedMessages', () => {
  it('initialStatusMessage includes target set count', () => {
    expect(initialStatusMessage()).toContain(String(TARGET_SET_COUNT));
  });

  it('savedLoadingMessage includes draw number', () => {
    expect(savedLoadingMessage(1200)).toBe('1200회차 저장된 추천 세트를 불러오는 중입니다...');
  });

  it('savedSuccessMessage includes draw and count', () => {
    expect(savedSuccessMessage(1200, 5)).toBe(
      '1200회차 기준 저장된 5개 추천 세트를 불러왔습니다.',
    );
  });

  it('savedEmptyMessage prompts generate and save', () => {
    expect(savedEmptyMessage(1200)).toContain('생성 및 저장');
  });

  it('savedErrorMessage includes draw number', () => {
    expect(savedErrorMessage(1200)).toBe('1200회차 세트 조회 중 오류가 발생했습니다.');
  });
});
