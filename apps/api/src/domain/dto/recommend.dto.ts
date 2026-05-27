import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class GenerateSetItemDto {
  @IsInt()
  @Min(1)
  @Max(45)
  num1!: number;

  @IsInt()
  @Min(1)
  @Max(45)
  num2!: number;

  @IsInt()
  @Min(1)
  @Max(45)
  num3!: number;

  @IsInt()
  @Min(1)
  @Max(45)
  num4!: number;

  @IsInt()
  @Min(1)
  @Max(45)
  num5!: number;

  @IsInt()
  @Min(1)
  @Max(45)
  num6!: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  strategy?: string;
}

export class GenerateSaveDto {
  @Type(() => Number)
  @IsInt()
  draw_no!: number;

  @IsOptional()
  @IsArray()
  applied_rule_ids?: string[];

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  excluded_numbers?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenerateSetItemDto)
  sets?: GenerateSetItemDto[];
}
