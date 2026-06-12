import { IsBoolean, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTaskRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  scheduledTime?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
