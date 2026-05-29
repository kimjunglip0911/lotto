/**
 * 홈 화면 상단에서 당첨 데이터 입력 흐름을 한곳에서 묶어 보여주는 영역이다.
 * 선택한 회차, 당첨 번호 6개, 보너스 번호, 저장 상태를 받아 화면에 전달하며,
 * 모든 번호가 유효하고 저장 중이 아닐 때만 저장 버튼을 활성화한다.
 */

import type { HomeGridSlice } from '../../hooks/useHomeView';
import { isValidLottoNumber } from '../../types/home';
import { DrawSelect } from './DrawSelect';
import { SaveBtn } from './SaveBtn';
import { WinInputs } from './WinInputs';

export type GridControlsProps = HomeGridSlice;

export function GridControls(props: GridControlsProps) {
  const {
    selectedDraw,
    availableDraws,
    winningNumbers,
    winningBonus,
    setSelectedDraw,
    onWinNumChg,
    onBonusChg,
    saveWinning,
    isSaving,
    saveStatus,
  } = props;

  const canSave =
    !isSaving &&
    winningNumbers.every(isValidLottoNumber) &&
    isValidLottoNumber(winningBonus);

  return (
    <div className="flex flex-col xl:flex-row xl:justify-between items-center gap-4 xl:gap-8 mb-8 z-10 w-full bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-md">
      <DrawSelect
        selectedDraw={selectedDraw}
        availableDraws={availableDraws}
        onSelectDraw={setSelectedDraw}
      />
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 w-full xl:w-auto">
        <WinInputs
          winningNumbers={winningNumbers}
          winningBonus={winningBonus}
          onWinNumChg={onWinNumChg}
          onBonusChg={onBonusChg}
        />
        <SaveBtn
          canSave={canSave}
          isSaving={isSaving}
          saveStatus={saveStatus}
          saveWinning={saveWinning}
        />
      </div>
    </div>
  );
}
