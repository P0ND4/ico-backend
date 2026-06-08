import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateSummaryRequest {
  @IsString()
  @IsNotEmpty()
  text!: string;
}
