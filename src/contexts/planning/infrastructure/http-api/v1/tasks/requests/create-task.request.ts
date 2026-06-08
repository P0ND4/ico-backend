import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTaskRequest {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  scheduledDate!: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;
}
