'use client';

/** 오류 메시지 배너 */

export const ErrorAlert = ({ message }: { message: string }) => (
  <div className="text-red-400 py-4 text-center border border-red-900/50 rounded-lg bg-red-950/20 mt-4">
    {message}
  </div>
);
