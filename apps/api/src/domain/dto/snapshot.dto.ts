import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  Max,
  Min,
} from 'class-validator';

export class SnapshotSaveDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  anchor_draw_no!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  schema_version = 2;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @Type(() => Number)
  final_numbers!: number[];
}

export class SnapshotGetDto {
  anchor_draw_no!: number;
  schema_version!: number;
  final_numbers!: number[];
  updated_at!: string;
}
