import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateConversationRequest {
  @ApiProperty({ example: 'My Conversation' })
  @IsString()
  @IsNotEmpty()
  title!: string;
}
