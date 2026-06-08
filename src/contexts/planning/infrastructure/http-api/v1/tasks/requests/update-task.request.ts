import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateTaskRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
