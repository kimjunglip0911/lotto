/**
 * 누적 분석 결과(4개 번호) 스냅샷을 저장·조회합니다.
 * 저장 전 helpers/snapshot.valid.ts로 회차·번호 범위를 검사합니다.
 * 해당 회차에 저장된 내용이 없으면 "스냅샷이 없습니다" 안내가 화면에 전달됩니다.
 */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  SnapshotGetDto,
  SnapshotSaveDto,
} from '../../../domain/dto/snapshot.dto';
import { assertSnapSave } from '../helpers/snapshot.valid';
import { SnapshotRepository } from '../repository/snapshot.repository';

const SNAP_NOT_FOUND = '해당 회차에 저장된 분석 스냅샷이 없습니다.';

@Injectable()
export class SnapshotService {
  constructor(private readonly repo: SnapshotRepository) {}

  async saveSnapshot(body: SnapshotSaveDto): Promise<void> {
    assertSnapSave(body);
    const [n1, n2, n3, n4] = body.final_numbers;
    await this.repo.saveSnapshot(
      body.anchor_draw_no,
      body.schema_version ?? 2,
      n1,
      n2,
      n3,
      n4,
    );
  }

  async getSnapshot(drawNo: number): Promise<SnapshotGetDto> {
    const row = await this.repo.getSnapshotRow(drawNo);
    if (!row) {
      throw new HttpException(SNAP_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return {
      anchor_draw_no: Number(row.anchor_draw_no),
      schema_version: Number(row.schema_version),
      final_numbers: [
        Number(row.final_num1),
        Number(row.final_num2),
        Number(row.final_num3),
        Number(row.final_num4),
      ],
      updated_at: String(row.updated_at),
    };
  }
}
