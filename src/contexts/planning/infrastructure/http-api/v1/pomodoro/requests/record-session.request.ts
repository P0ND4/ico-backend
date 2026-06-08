import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class RecordSessionRequest {
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsBoolean()
  isCompleted!: boolean;

  @IsDateString()
  startedAt!: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
