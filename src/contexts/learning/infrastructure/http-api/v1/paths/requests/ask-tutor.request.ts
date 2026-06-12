import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AskTutorRequest {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsOptional()
  chapterContext?: string;
}
