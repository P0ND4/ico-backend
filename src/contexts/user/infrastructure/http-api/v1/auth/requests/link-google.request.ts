import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LinkGoogleRequest {
  @ApiProperty({
    description: 'Google ID token obtained from the Google Sign-In SDK',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...',
  })
  @IsString()
  idToken!: string;
}
