import { IsOptional, IsString } from 'class-validator';

export class CreateConversationRequest {
  @IsOptional()
  @IsString()
  title?: string;
}
