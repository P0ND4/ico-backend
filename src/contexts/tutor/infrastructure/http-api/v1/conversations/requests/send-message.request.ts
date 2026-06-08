import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageRequest {
  @ApiProperty({ example: 'Explain recursion with a simple example.' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
