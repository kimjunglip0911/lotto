import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class SaveWinningDto {
  @Type(() => Number)
  @IsInt()
  draw_no!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(45)
  num1!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(45)
  num2!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(45)
  num3!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(45)
  num4!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(45)
  num5!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(45)
  num6!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(45)
  bonus_num!: number;
}
