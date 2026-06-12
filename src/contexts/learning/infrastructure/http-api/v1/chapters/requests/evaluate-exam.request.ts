import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ExamAnswer {
  @IsString()
  lessonId!: string;

  @IsString()
  text!: string;
}

export class EvaluateExamRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamAnswer)
  answers!: ExamAnswer[];
}
