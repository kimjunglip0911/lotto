/** 스냅샷 저장 후 성공·실패 한 줄 메시지입니다. */

type Props = {
  saveSnapshotMessage: string | null;
  saveSnapshotError: string | null;
};

export const SnapSaveMsgs = ({ saveSnapshotMessage, saveSnapshotError }: Props) =>
  (saveSnapshotMessage || saveSnapshotError) && (
    <div className="flex flex-wrap gap-3 text-sm">
      {saveSnapshotMessage && <p className="text-emerald-300">{saveSnapshotMessage}</p>}
      {saveSnapshotError && <p className="text-rose-300">{saveSnapshotError}</p>}
    </div>
  );
