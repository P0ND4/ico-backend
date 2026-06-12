import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTaskRequest {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  scheduledDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  scheduledTime?: string;
}
