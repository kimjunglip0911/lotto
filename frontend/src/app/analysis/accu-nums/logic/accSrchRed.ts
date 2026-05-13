/** 조회 버튼·API 응답에 따라 accSrchSt를 바꾼다(apply 분기는 accSrchRedApply). */

import { accSrchApplyOut, emptyAccDerived } from './accSrchRedApply';
import type { AccSrchAct, AccSrchSt } from './accSrchStDef';

export type { AccSrchAct } from './accSrchStDef';

export const accSrchRed = (s: AccSrchSt, a: AccSrchAct): AccSrchSt => {
  if (a.type === 'start') {
    return {
      ...s,
      isSearching: true,
      isLoadingSelectedWinningNumber: true,
      searchError: null,
      selectedWinningNumberError: null,
      searchedDraw: a.draw,
    };
  }
  if (a.type === 'end') {
    return { ...s, isSearching: false, isLoadingSelectedWinningNumber: false };
  }
  if (a.type === 'fail') {
    return {
      ...s,
      searchError: '조회 데이터를 불러오지 못했습니다.',
      selectedWinningNumberError: '선택한 회차의 당첨번호를 불러오지 못했습니다.',
      selectedWinningNumber: null,
      ...emptyAccDerived(),
    };
  }
  if (a.type === 'invalidSel') {
    return {
      ...s,
      searchError: '유효한 회차를 선택해 주세요.',
      searchedDraw: '',
      selectedWinningNumber: null,
      ...emptyAccDerived(),
    };
  }
  if (a.type === 'resetDerived') {
    const base = { ...s, ...emptyAccDerived() };
    return a.clearWin ? { ...base, selectedWinningNumber: null } : base;
  }
  if (a.type === 'apply') {
    return accSrchApplyOut(s, a.out);
  }
  return s;
};
