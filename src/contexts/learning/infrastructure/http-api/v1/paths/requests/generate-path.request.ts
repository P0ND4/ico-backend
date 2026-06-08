import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class GeneratePathRequest {
  @ApiProperty({ example: 'The French Revolution' })
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @ApiProperty({ enum: ['standard', 'deep'] })
  @IsIn(['standard', 'deep'])
  mode!: 'standard' | 'deep';
}
