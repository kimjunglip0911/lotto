/** 회차 선택·당첨번호 입력·저장 컨트롤 바 */

import { isValidLottoNumber, type InputNumber, type SaveStatus } from '../../types/home';
import { DrawSelect } from './DrawSelect';
import { SaveBtn } from './SaveBtn';
import { WinInputs } from './WinInputs';

interface GridControlsProps {
  selectedDraw: number | null;
  availableDraws: number[];
  winningNumbers: InputNumber[];
  winningBonus: InputNumber;
  onSelectDraw: (value: number | null) => void;
  onWinningNumberChange: (index: number, value: string) => void;
  onBonusNumberChange: (value: string) => void;
  onSaveWinning: () => void;
  isSaving: boolean;
  saveStatus: SaveStatus;
}

export function GridControls(props: GridControlsProps) {
  const canSave =
    !props.isSaving &&
    props.winningNumbers.every(isValidLottoNumber) &&
    isValidLottoNumber(props.winningBonus);

  return (
    <div className="flex flex-col xl:flex-row xl:justify-between items-center gap-4 xl:gap-8 mb-8 z-10 w-full bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-md">
      <DrawSelect
        selectedDraw={props.selectedDraw}
        availableDraws={props.availableDraws}
        onSelectDraw={props.onSelectDraw}
      />
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 w-full xl:w-auto">
        <WinInputs
          winningNumbers={props.winningNumbers}
          winningBonus={props.winningBonus}
          onWinningNumberChange={props.onWinningNumberChange}
          onBonusNumberChange={props.onBonusNumberChange}
        />
        <SaveBtn
          canSave={canSave}
          isSaving={props.isSaving}
          saveStatus={props.saveStatus}
          onSaveWinning={props.onSaveWinning}
        />
      </div>
    </div>
  );
}
