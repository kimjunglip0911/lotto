/**
 * 스냅샷 저장 요청이 규칙에 맞는지 검사합니다.
 * 회차가 1 이하이거나 번호가 1~45 밖이면 거절 메시지와 함께 오류를 냅니다.
 * service/snapshot.service.ts가 저장 전에 호출합니다.
 */
import { HttpException, HttpStatus } from '@nestjs/common';
import { SnapshotSaveDto } from '../../../domain/dto/snapshot.dto';

export const assertSnapSave = (body: SnapshotSaveDto): void => {
  if (body.anchor_draw_no <= 1) {
    throw new HttpException(
      '회차 1은 이전 회차 집계가 없어 저장할 수 없습니다.',
      HttpStatus.BAD_REQUEST,
    );
  }
  for (const n of body.final_numbers) {
    if (n < 1 || n > 45) {
      throw new HttpException(
        'final_numbers must be in 1..45',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
};
